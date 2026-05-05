import fs from "fs"
import { join } from "path"
import { parse } from "yaml"
import { listMigrationFileNames } from "./fileNames"
import { MIGRATIONS_DIR, type AppliedMigrationsState, type MigrationEntry } from "./types"

export interface PendingMigrationFile {
  fileName: string
  entries: MigrationEntry[]
}

export function readMigrationFile(path: string): MigrationEntry[] {
  const parsed = parse(fs.readFileSync(path, "utf-8")) as unknown
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Файл миграции должен быть YAML-словарём: ${path}`)
  }

  return Object.entries(parsed as Record<string, unknown>).map(([key, value]) => {
    if (typeof value !== "string" || value.length === 0) {
      throw new Error(`Значение миграции должно быть непустой строкой: ${key}`)
    }
    return { path: key, value }
  })
}

export function readPendingMigrationEntries(yamlDir: string, appliedState: AppliedMigrationsState): PendingMigrationFile[] {
  const applied = new Set(appliedState.applied)
  return listMigrationFileNames(yamlDir)
    .filter((fileName) => !applied.has(fileName))
    .map((fileName) => ({
      fileName,
      entries: readMigrationFile(join(yamlDir, MIGRATIONS_DIR, fileName)),
    }))
}
