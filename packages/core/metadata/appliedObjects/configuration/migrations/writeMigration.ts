import fs from "fs"
import { join } from "path"
import { migrationFileNameToDate, nextMigrationFileName } from "./fileNames"
import { MIGRATIONS_DIR, type MigrationEntry } from "./types"

export function writeMigrationFile(params: {
  yamlDir: string
  entries: MigrationEntry[]
  now?: Date
}): string {
  if (!fs.existsSync(params.yamlDir)) throw new Error(`YAML-каталог не найден: ${params.yamlDir}`)
  const migrationsDir = join(params.yamlDir, MIGRATIONS_DIR)
  fs.mkdirSync(migrationsDir, { recursive: true })
  const data = Object.fromEntries(params.entries.map((entry) => [entry.path, entry.value]))
  const content = exportMigrationRenameMap(data)
  let now = params.now ?? new Date()

  while (true) {
    const fileName = nextMigrationFileName(params.yamlDir, now)
    const filePath = join(migrationsDir, fileName)

    try {
      fs.writeFileSync(filePath, content, { encoding: "utf-8", flag: "wx" })
      return filePath
    } catch (error) {
      if (!isFileExistsError(error)) throw error
      now = new Date(migrationFileNameToDate(fileName).getTime() + 1000)
    }
  }
}

function exportMigrationRenameMap(value: Record<string, string>): string {
  return Object.entries(value)
    .map(([key, item]) => `${JSON.stringify(key)}: ${item}\n`)
    .join("")
}

function isFileExistsError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "EEXIST"
}
