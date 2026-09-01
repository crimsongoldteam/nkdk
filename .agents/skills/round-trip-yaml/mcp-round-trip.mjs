#!/usr/bin/env node
import { readFile, writeFile, mkdir } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { buildCompiledMcp } from "../../tools/mcp/build-compiled.mjs"
import { callMcpToolToCompletion, createMcpToolSession } from "../../tools/mcp/call.mjs"

async function writeJson(path, value) {
  if (path === undefined) return
  await mkdir(dirname(resolve(path)), { recursive: true })
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8")
}

const defaultDependencies = {
  buildMcp: buildCompiledMcp,
  createSession: createMcpToolSession,
  callToCompletion: callMcpToolToCompletion,
  writeResult: writeJson,
}

export async function runMcpRoundTrip(manifest, overrides = {}) {
  const dependencies = { ...defaultDependencies, ...overrides }
  const components = requireComponents(manifest)
  await dependencies.buildMcp()
  const session = await dependencies.createSession({ serverMode: "compiled" })
  const results = []

  try {
    for (const component of components) {
      let imported
      try {
        imported = await dependencies.callToCompletion(session, "nkdk.import_from_xml", {
          xmlDir: component.xmlDir,
          projectDir: component.projectDir,
          componentPath: component.componentPath,
          ...(component.concurrency === undefined ? {} : { concurrency: component.concurrency }),
          allowWrite: true,
        }, { signal: manifest.signal })
      } catch (error) {
        throw stageError("import", component.componentPath, error)
      }
      await dependencies.writeResult(component.importOutputPath, imported.payload)

      let synced
      try {
        synced = await dependencies.callToCompletion(session, "nkdk.sync_to_xml", {
          xmlDir: component.xmlOutputDir,
          projectDir: component.projectDir,
          componentPath: component.componentPath,
          allowWrite: true,
          ignoreValidationErrors: true,
        }, { signal: manifest.signal })
      } catch (error) {
        throw stageError("sync", component.componentPath, error)
      }
      await dependencies.writeResult(component.syncOutputPath, synced.payload)
      results.push({
        componentPath: component.componentPath,
        import: imported.payload,
        sync: synced.payload,
      })
    }
  } finally {
    await session.close()
  }

  return { ok: true, components: results }
}

function requireComponents(manifest) {
  if (!manifest || typeof manifest !== "object" || !Array.isArray(manifest.components)) {
    throw new Error("manifest.components должен быть массивом")
  }
  return manifest.components.map((component, index) => {
    for (const field of ["xmlDir", "xmlOutputDir", "projectDir", "componentPath"]) {
      if (typeof component?.[field] !== "string" || component[field].length === 0) {
        throw new Error(`manifest.components[${index}].${field} обязателен`)
      }
    }
    return component
  })
}

function stageError(stage, componentPath, error) {
  return new Error(
    `${stage} ${componentPath}: ${error instanceof Error ? error.message : String(error)}`,
    { cause: error }
  )
}

function parseCliArgs(argv) {
  const options = {}
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    const value = argv[index + 1]
    if ((arg !== "--manifest" && arg !== "--output") || value === undefined) {
      throw new Error("Использование: mcp-round-trip.mjs --manifest path [--output path]")
    }
    if (arg === "--manifest") options.manifest = value
    else options.output = value
    index += 1
  }
  if (options.manifest === undefined) throw new Error("--manifest обязателен")
  return options
}

function bindProcessCancellation(controller) {
  const cancel = (signal) => controller.abort(new Error(`Получен ${signal}`))
  const onInterrupt = () => cancel("SIGINT")
  const onTerminate = () => cancel("SIGTERM")
  process.once("SIGINT", onInterrupt)
  process.once("SIGTERM", onTerminate)
  return () => {
    process.off("SIGINT", onInterrupt)
    process.off("SIGTERM", onTerminate)
  }
}

async function main() {
  const options = parseCliArgs(process.argv.slice(2))
  const manifest = JSON.parse(await readFile(options.manifest, "utf8"))
  const controller = new AbortController()
  const disposeSignals = bindProcessCancellation(controller)
  try {
    const result = await runMcpRoundTrip({ ...manifest, signal: controller.signal })
    await writeJson(options.output, result)
  } finally {
    disposeSignals()
  }
}

const isCliEntrypoint =
  process.argv[1] !== undefined && pathToFileURL(resolve(process.argv[1])).href === import.meta.url

if (isCliEntrypoint) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}
