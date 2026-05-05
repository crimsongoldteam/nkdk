import fs from "fs"
import { join } from "path"
import { parse, stringify } from "yaml"
import { APPLIED_MIGRATIONS_FILE, type AppliedMigrationsState } from "./types"
import { isMigrationFileName } from "./fileNames"

export function readAppliedMigrationsState(xmlDir: string): AppliedMigrationsState {
  const path = join(xmlDir, APPLIED_MIGRATIONS_FILE)
  if (!fs.existsSync(path)) return { applied: [] }

  const parsed = parse(fs.readFileSync(path, "utf-8")) as unknown
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${APPLIED_MIGRATIONS_FILE}: ожидается YAML-словарь`)
  }
  const applied = (parsed as { applied?: unknown }).applied
  if (!Array.isArray(applied)) {
    throw new Error(`${APPLIED_MIGRATIONS_FILE}: поле applied должно быть списком`)
  }

  return { applied: validateAppliedMigrationNames(applied) }
}

function validateAppliedMigrationNames(applied: unknown[]): string[] {
  const seen = new Set<string>()
  for (const name of applied) {
    if (typeof name !== "string" || !isMigrationFileName(name)) {
      throw new Error(`Некорректное имя применённой миграции "${String(name)}"`)
    }
    if (seen.has(name)) throw new Error(`Дубликат применённой миграции "${name}"`)
    seen.add(name)
  }

  return [...applied]
}

export function writeAppliedMigrationsState(xmlDir: string, state: AppliedMigrationsState): void {
  const applied = validateAppliedMigrationNames(state.applied)
  fs.mkdirSync(xmlDir, { recursive: true })
  fs.writeFileSync(join(xmlDir, APPLIED_MIGRATIONS_FILE), stringify({ applied }), "utf-8")
}
