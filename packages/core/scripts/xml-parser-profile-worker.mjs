import { readFile } from "node:fs/promises"
import { isAbsolute, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { performance } from "node:perf_hooks"
import { tsImport } from "tsx/esm/api"

async function main(argv) {
  const { parserName, manifestPath } = parseWorkerArguments(argv)
  const paths = JSON.parse(await readFile(manifestPath, "utf8"))
  if (!Array.isArray(paths) || paths.some((path) => typeof path !== "string" || !isAbsolute(path))) {
    throw new Error("Manifest должен содержать массив абсолютных XML-путей")
  }

  const documents = await Promise.all(paths.map((path) => readFile(path, "utf8")))
  const parse = await loadParser(parserName)
  global.gc?.()
  const started = performance.now()
  let lastResult
  for (const document of documents) lastResult = parse(document)
  const elapsedMs = performance.now() - started
  if (documents.length > 0 && lastResult === undefined) {
    throw new Error("Парсер не вернул результат для последнего XML")
  }

  process.stdout.write(
    `${JSON.stringify({
      parser: parserName,
      files: documents.length,
      bytes: documents.reduce((sum, document) => sum + Buffer.byteLength(document), 0),
      elapsedMs,
      peakRssMiB: process.resourceUsage().maxRSS / 1024,
    })}\n`
  )
}

function parseWorkerArguments(argv) {
  const parserIndex = argv.indexOf("--parser")
  const manifestIndex = argv.indexOf("--manifest")
  const parserName = argv[parserIndex + 1]
  const manifestPath = argv[manifestIndex + 1]
  if ((parserName !== "current" && parserName !== "saxes") || manifestPath === undefined || !isAbsolute(manifestPath)) {
    throw new Error("Использование: --parser current|saxes --manifest ABS")
  }
  return { parserName, manifestPath }
}

async function loadParser(parserName) {
  if (parserName === "current") {
    const module = await tsImport("../xml/import/importer.ts", import.meta.url)
    return module.importContentFromXML
  }
  const module = await tsImport("../xml/import/experimental/saxesImporter.ts", import.meta.url)
  return module.importContentFromXMLWithSaxes
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}
