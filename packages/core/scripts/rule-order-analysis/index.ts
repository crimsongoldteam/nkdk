import { isAbsolute, join } from "node:path"
import { pathToFileURL } from "node:url"
import { analyzeRuleOrder } from "../../metadata/ruleOrderAnalysis/analyze"
import { createRuleOrderOutput } from "./output"

interface Arguments {
  xmlRoot: string
  output: string
  concurrency?: number
  witnessLimit?: number
}

export function parseArguments(argv: readonly string[]): Arguments {
  const values = new Map<string, string>()
  const allowed = new Set(["--xml-root", "--output", "--concurrency", "--witness-limit"])
  for (let index = 0; index < argv.length; index += 2) {
    const name = argv[index]
    const value = argv[index + 1]
    if (name === undefined || !allowed.has(name)) throw new Error(`Неизвестный аргумент: ${name ?? ""}`)
    if (value === undefined || value.startsWith("--")) throw new Error(`Не задано значение ${name}`)
    if (values.has(name)) throw new Error(`Аргумент указан повторно: ${name}`)
    values.set(name, value)
  }
  const xmlRoot = values.get("--xml-root")
  const output = values.get("--output")
  if (xmlRoot === undefined || output === undefined) throw new Error("Обязательны --xml-root и --output")
  if (!isAbsolute(xmlRoot) || !isAbsolute(output)) throw new Error("Пути должны быть абсолютными")
  return {
    xmlRoot,
    output,
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
  const output = await createRuleOrderOutput(args.output)
  try {
    const result = await analyzeRuleOrder({
      xmlRoot: args.xmlRoot,
      metadataDir: join(import.meta.dirname, "../../metadata"),
      concurrency: args.concurrency,
      witnessLimit: args.witnessLimit,
      onObservation: output.accept,
    })
    await output.complete(result)
    console.log(
      `${join(args.output, "report.md")}: ${result.observationCount} наблюдений, ` +
        `${result.rules.reduce((sum, rule) => sum + rule.conflicts.length, 0)} конфликтов`
    )
  } catch (caught) {
    await output.fail(caught)
    throw caught
  }
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((caught) => {
    console.error(caught instanceof Error ? caught.message : String(caught))
    process.exitCode = 1
  })
}
