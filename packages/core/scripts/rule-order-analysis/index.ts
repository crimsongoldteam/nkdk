import { execFile } from "node:child_process"
import { readFile, writeFile } from "node:fs/promises"
import { isAbsolute, join } from "node:path"
import { pathToFileURL } from "node:url"
import { promisify } from "node:util"
import { analyzeRuleOrder } from "../../metadata/ruleOrderAnalysis/analyze"
import type { CanonicalRuleOrder } from "../../metadata/ruleOrderAnalysis/canonicalOrder"
import type { RuleOrderSource } from "../../metadata/ruleOrderAnalysis/types"
import { createRuleOrderOutput } from "./output"
import { applyRuleSourceEdits } from "./rewrite"
import { buildRuleSourceEdits } from "./sourceModel"

interface Arguments {
  xmlRoot: string
  configuration?: string
  extensionRoot?: string
  extensionBase?: string
  output: string
  apply: boolean
  concurrency?: number
  witnessLimit?: number
}

export function parseArguments(argv: readonly string[]): Arguments {
  const values = new Map<string, string>()
  const allowed = new Set([
    "--xml-root",
    "--configuration",
    "--extension-root",
    "--extension-base",
    "--output",
    "--concurrency",
    "--witness-limit",
  ])
  let apply = false
  for (let index = 0; index < argv.length; ) {
    const name = argv[index]
    if (name === "--apply") {
      if (apply) throw new Error("Аргумент указан повторно: --apply")
      apply = true
      index += 1
      continue
    }
    const value = argv[index + 1]
    if (name === undefined || !allowed.has(name)) throw new Error(`Неизвестный аргумент: ${name ?? ""}`)
    if (value === undefined || value.startsWith("--")) throw new Error(`Не задано значение ${name}`)
    if (values.has(name)) throw new Error(`Аргумент указан повторно: ${name}`)
    values.set(name, value)
    index += 2
  }
  const xmlRoot = values.get("--xml-root")
  const configuration = values.get("--configuration")
  const extensionRoot = values.get("--extension-root")
  const extensionBase = values.get("--extension-base")
  const output = values.get("--output")
  if (xmlRoot === undefined || output === undefined) throw new Error("Обязательны --xml-root и --output")
  if ((extensionRoot === undefined) !== (extensionBase === undefined)) {
    throw new Error("--extension-root и --extension-base должны быть указаны вместе")
  }
  if (!isAbsolute(xmlRoot) || !isAbsolute(output) || (extensionRoot !== undefined && !isAbsolute(extensionRoot))) {
    throw new Error("Пути должны быть абсолютными")
  }
  return {
    xmlRoot,
    ...(configuration === undefined ? {} : { configuration }),
    ...(extensionRoot === undefined ? {} : { extensionRoot }),
    ...(extensionBase === undefined ? {} : { extensionBase }),
    output,
    apply,
    ...optionalPositiveInteger(values, "--concurrency", "concurrency"),
    ...optionalPositiveInteger(values, "--witness-limit", "witnessLimit"),
  }
}

function optionalPositiveInteger<Key extends "concurrency" | "witnessLimit">(
  values: ReadonlyMap<string, string>,
  argument: string,
  key: Key
): Partial<Record<Key, number>> {
  const raw = values.get(argument)
  if (raw === undefined) return {}
  const value = Number(raw)
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${argument} должен быть положительным целым числом`)
  return { [key]: value } as Record<Key, number>
}

export async function main(argv = process.argv.slice(2)): Promise<void> {
  const args = parseArguments(argv)
  if (args.apply) await assertCleanWorktree()
  const output = await createRuleOrderOutput(args.output)
  try {
    const result = await analyzeRuleOrder({
      xmlRoot: args.xmlRoot,
      configuration: args.configuration,
      extensionRoot: args.extensionRoot,
      extensionBase: args.extensionBase,
      metadataDir: join(import.meta.dirname, "../../metadata"),
      concurrency: args.concurrency,
      witnessLimit: args.witnessLimit,
      onObservation: output.accept,
    })
    await output.complete(result)
    if (args.apply) {
      if (result.skippedObservationCount > 0) {
        throw new Error(`Нельзя переписать rules.ts: пропущено наблюдений ${result.skippedObservationCount}`)
      }
      if (result.ambiguities.length > 0) {
        throw new Error(`Нельзя переписать rules.ts: неоднозначных правил ${result.ambiguities.length}`)
      }
      const sources = sourcesForRewrite(result)
      const edits = await buildRuleSourceEdits({
        orders: result.canonicalOrders,
        sources,
        readFile: (path) => readFile(path, "utf8"),
      })
      await writeFile(
        join(args.output, "rewrite-plan.json"),
        `${JSON.stringify(
          edits.map((edit) => ({
            filePath: edit.filePath,
            candidates: edit.candidates,
          })),
          null,
          2
        )}\n`,
        { flag: "wx" }
      )
      await applyRuleSourceEdits({
        edits,
        readFile: (path) => readFile(path, "utf8"),
        writeFile: (path, text) => writeFile(path, text, "utf8"),
        verify: async () => {
          const remaining = await buildRuleSourceEdits({
            orders: result.canonicalOrders,
            sources,
            readFile: (path) => readFile(path, "utf8"),
          })
          if (remaining.length > 0) throw new Error("Проверка переписанных rules.ts обнаружила оставшиеся изменения")
        },
      })
    }
    console.log(
      `${join(args.output, "report.md")}: ${result.observationCount} наблюдений, ` +
        `${result.rules.reduce((sum, rule) => sum + rule.conflicts.length, 0)} конфликтов`
    )
  } catch (caught) {
    await output.fail(caught)
    throw caught
  }
}

export function sourcesForRewrite(result: {
  canonicalOrders: readonly CanonicalRuleOrder[]
  unobservedSources: readonly RuleOrderSource[]
}): readonly RuleOrderSource[] {
  const byCandidate = new Map<string, RuleOrderSource>()
  for (const source of [
    ...result.canonicalOrders.map((order) => order.source),
    ...result.unobservedSources,
  ]) {
    const existing = byCandidate.get(source.candidate)
    if (existing !== undefined && JSON.stringify(existing) !== JSON.stringify(source)) {
      throw new Error(`Различающиеся source для ${source.candidate}`)
    }
    byCandidate.set(source.candidate, source)
  }
  return [...byCandidate.values()].sort((left, right) =>
    Buffer.compare(Buffer.from(left.candidate), Buffer.from(right.candidate))
  )
}

async function assertCleanWorktree(): Promise<void> {
  const { stdout } = await promisify(execFile)("git", ["status", "--porcelain"], {
    cwd: join(import.meta.dirname, "../../../.."),
    encoding: "utf8",
  })
  if (stdout.length > 0) throw new Error("Для --apply требуется чистый Git worktree")
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((caught) => {
    console.error(caught instanceof Error ? caught.message : String(caught))
    process.exitCode = 1
  })
}
