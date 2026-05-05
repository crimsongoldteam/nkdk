import fs from "fs"
import { join } from "path"
import { stringify } from "yaml"
import { nextMigrationFileName } from "./fileNames"
import { MIGRATIONS_DIR, type MigrationEntry } from "./types"

export function writeMigrationFile(params: {
  yamlDir: string
  entries: MigrationEntry[]
  now?: Date
}): string {
  if (!fs.existsSync(params.yamlDir)) throw new Error(`YAML-каталог не найден: ${params.yamlDir}`)
  const migrationsDir = join(params.yamlDir, MIGRATIONS_DIR)
  fs.mkdirSync(migrationsDir, { recursive: true })
  const fileName = nextMigrationFileName(params.yamlDir, params.now)
  const filePath = join(migrationsDir, fileName)
  const data = Object.fromEntries(params.entries.map((entry) => [entry.path, entry.value]))
  fs.writeFileSync(filePath, stringify(data, { defaultKeyType: "QUOTE_DOUBLE" }), "utf-8")
  return filePath
}
