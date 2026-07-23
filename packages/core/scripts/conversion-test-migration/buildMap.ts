import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { extractScenarios } from "./extractScenarios"
import { readDeletedTests } from "./readDeletedTests"
import type { DeletedScenario, MigrationRow } from "./types"

export function buildMigrationMap(
  scenarios: DeletedScenario[],
  existingRows: MigrationRow[] = []
): MigrationRow[] {
  const existingById = new Map(existingRows.map((row) => [row.id, row]))
  return scenarios.map((scenario) => {
    const existing = existingById.get(scenario.id)
    return {
      ...scenario,
      behavior: existing?.behavior ?? "",
      targetPath: existing?.targetPath ?? targetPathFor(scenario),
      targetTitle: existing?.targetTitle ?? "",
      status: existing?.status ?? "pending",
      ...(existing?.justification === undefined ? {} : { justification: existing.justification }),
    }
  })
}

function targetPathFor(scenario: DeletedScenario): string {
  const targetName =
    scenario.direction === "fromXML" || scenario.direction === "toYAML"
      ? "fromXMLToYAML.test.ts"
      : scenario.direction === "fromYAML" || scenario.direction === "toXML"
        ? "fromYAMLToXML.test.ts"
        : undefined
  return targetName === undefined ? scenario.sourcePath : `${dirname(scenario.sourcePath)}/${targetName}`
}

function main(): void {
  const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..")
  const args = process.argv.slice(2)
  const range = readArgument(args, "--range")
  if (range === undefined) throw new Error("Нужно указать --range <git-range>")

  const mapPath = resolve(dirname(fileURLToPath(import.meta.url)), "migration-map.json")
  const existingRows = existsSync(mapPath)
    ? (JSON.parse(readFileSync(mapPath, "utf8")) as MigrationRow[])
    : []
  const scenarios = readDeletedTests(range, repositoryRoot).flatMap(extractScenarios)
  const rows = buildMigrationMap(scenarios, existingRows)
  const content = `${JSON.stringify(rows, null, 2)}\n`

  if (args.includes("--check")) {
    if (!existsSync(mapPath) || readFileSync(mapPath, "utf8") !== content) {
      process.stderr.write("Карта миграции не соответствует истории Git\n")
      process.exitCode = 1
      return
    }
    process.stdout.write(`Карта не изменилась: ${rows.length} сценариев\n`)
    return
  }

  writeFileSync(mapPath, content)
  process.stdout.write(`Записано сценариев: ${rows.length}\n`)
}

function readArgument(args: string[], name: string): string | undefined {
  const index = args.indexOf(name)
  return index < 0 ? undefined : args[index + 1]
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
}
