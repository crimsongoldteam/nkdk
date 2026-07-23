import { existsSync, readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { extractScenarios } from "./extractScenarios"
import { readDeletedTests } from "./readDeletedTests"
import type { AuditError, AuditOptions, MigrationRow } from "./types"

export function auditMigrationMap(rows: MigrationRow[], options: AuditOptions): AuditError[] {
  const errors: AuditError[] = []
  const expectedIds = new Set(options.expectedScenarios.map(({ id }) => id))
  const rowCounts = countIds(rows)

  for (const [id, count] of rowCounts) {
    if (id.length === 0) errors.push({ message: "Строка содержит пустой id" })
    if (count > 1) errors.push({ id, message: `Дублируется id: ${id}` })
    if (!expectedIds.has(id)) errors.push({ id, message: `Лишняя строка без исходного сценария: ${id}` })
  }
  for (const id of expectedIds) {
    if (!rowCounts.has(id)) errors.push({ id, message: `Нет строки для исходного сценария: ${id}` })
  }

  for (const row of uniqueRows(rows)) auditRow(row, options, errors)
  return errors
}

function auditRow(row: MigrationRow, options: AuditOptions, errors: AuditError[]): void {
  if (row.status === "pending") {
    if (options.requireComplete) errors.push({ id: row.id, message: `Сценарий не перенесён: ${row.id}` })
    return
  }
  if (row.behavior.trim().length === 0) {
    errors.push({ id: row.id, message: `Не описано поведение: ${row.id}` })
  }
  if (row.status === "obsolete-internal") {
    if (row.justification?.trim().length === 0) {
      errors.push({ id: row.id, message: `Нет обоснования obsolete-internal: ${row.id}` })
    }
    return
  }
  if (row.status !== "migrated") {
    errors.push({ id: row.id, message: `Неизвестное состояние: ${String(row.status)}` })
    return
  }
  if (row.targetPath.trim().length === 0) {
    errors.push({ id: row.id, message: `Не указан целевой путь: ${row.id}` })
    return
  }

  const targetPath = resolve(options.repositoryRoot, row.targetPath)
  if (!existsSync(targetPath)) {
    errors.push({ id: row.id, message: `Целевой тест не существует: ${row.targetPath}` })
    return
  }
  if (row.targetTitle.trim().length === 0) {
    errors.push({ id: row.id, message: `Не указан новый заголовок: ${row.id}` })
    return
  }
  if (!readFileSync(targetPath, "utf8").includes(row.targetTitle)) {
    errors.push({ id: row.id, message: `В целевом файле нет заголовка: ${row.targetTitle}` })
  }
}

function countIds(rows: MigrationRow[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const { id } of rows) counts.set(id, (counts.get(id) ?? 0) + 1)
  return counts
}

function uniqueRows(rows: MigrationRow[]): MigrationRow[] {
  const byId = new Map<string, MigrationRow>()
  for (const row of rows) if (!byId.has(row.id)) byId.set(row.id, row)
  return [...byId.values()]
}

function main(): void {
  const scriptDirectory = dirname(fileURLToPath(import.meta.url))
  const repositoryRoot = resolve(scriptDirectory, "../../../..")
  const args = process.argv.slice(2)
  const range = readArgument(args, "--range") ?? "origin/develop..HEAD"
  const layer = readArgument(args, "--layer")
  const remainingOnly = args.includes("--remaining")
  const requireComplete = !args.includes("--allow-pending")
  const allRows = JSON.parse(readFileSync(resolve(scriptDirectory, "migration-map.json"), "utf8")) as MigrationRow[]
  const allScenarios = readDeletedTests(range, repositoryRoot).flatMap(extractScenarios)
  const selectedIds = new Set(
    allRows
      .filter((row) => matchesSelection(row, layer, remainingOnly))
      .map(({ id }) => id)
  )
  const rows = allRows.filter(({ id }) => selectedIds.has(id))
  const expectedScenarios = allScenarios.filter((scenario) =>
    layer === undefined && !remainingOnly
      ? true
      : remainingOnly
        ? selectedIds.has(scenario.id)
        : scenario.sourcePath.includes(`/metadata/${layer}/`)
  )
  const errors = auditMigrationMap(rows, { repositoryRoot, expectedScenarios, requireComplete })
  const pending = rows.filter(({ status }) => status === "pending").length
  const migrated = rows.filter(({ status }) => status === "migrated").length
  const obsolete = rows.filter(({ status }) => status === "obsolete-internal").length

  process.stdout.write(
    `Сценарии: ${rows.length}; migrated=${migrated}; obsolete-internal=${obsolete}; pending=${pending}; errors=${errors.length}\n`
  )
  for (const error of errors) process.stderr.write(`${error.message}\n`)
  if (errors.length > 0) process.exitCode = 1
}

function matchesSelection(row: MigrationRow, layer: string | undefined, remainingOnly: boolean): boolean {
  if (remainingOnly) return row.status === "pending"
  return layer === undefined || row.sourcePath.includes(`/metadata/${layer}/`)
}

function readArgument(args: string[], name: string): string | undefined {
  const index = args.indexOf(name)
  return index < 0 ? undefined : args[index + 1]
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
}
