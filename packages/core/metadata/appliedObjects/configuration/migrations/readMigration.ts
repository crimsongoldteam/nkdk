import fs from "fs"
import { join } from "path"
import { importFromYAML } from "../../../../yaml/import"
import { listMigrationFileNames } from "./fileNames"
import { MIGRATIONS_DIR, type AppliedMigrationsState, type MigrationEntry } from "./types"

export interface PendingMigrationFile {
  fileName: string
  entries: MigrationEntry[]
}

export function readMigrationFile(path: string): MigrationEntry[] {
  const parsed = importFromYAML<unknown>(fs.readFileSync(path, "utf-8"))
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Файл миграции должен быть YAML-словарём: ${path}`)
  }

  const entries = Object.entries(parsed as Record<string, unknown>)
  if (entries.length !== 1) {
    throw new Error("Файл миграции должен содержать ровно одно переименование")
  }

  return entries.map(([key, value]) => {
    if (typeof value !== "string" || value.length === 0) {
      throw new Error(`Значение миграции должно быть непустой строкой: ${key}`)
    }
    if (!isValidMigrationLocalName(value)) {
      throw new Error(`Значение миграции должно быть локальным именем без точки: ${key}`)
    }
    return { path: key, value }
  })
}

function isValidMigrationLocalName(value: string): boolean {
  return !value.includes(".") && /^[A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё0-9_]*$/.test(value)
}

export function readPendingMigrationEntries(
  yamlDir: string,
  appliedState: AppliedMigrationsState
): PendingMigrationFile[] {
  const applied = new Set(appliedState.applied)
  return listMigrationFileNames(yamlDir)
    .filter((fileName) => !applied.has(fileName))
    .map((fileName) => ({
      fileName,
      entries: readMigrationFile(join(yamlDir, MIGRATIONS_DIR, fileName)),
    }))
}
