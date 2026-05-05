import fs from "fs"
import { join } from "path"
import { MIGRATIONS_DIR } from "./types"

const FILE_RE = /^\d{4}-\d{2}-\d{2}-\d{6}\.yaml$/

export function isMigrationFileName(name: string): boolean {
  if (!FILE_RE.test(name)) return false
  const date = parseMigrationFileNameDate(name)
  return !Number.isNaN(date.getTime()) && formatMigrationFileName(date) === name
}

export function listMigrationFileNames(yamlDir: string): string[] {
  const dir = join(yamlDir, MIGRATIONS_DIR)
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter(isMigrationFileName)
    .sort((a, b) => a.localeCompare(b))
}

export function migrationFileNameToDate(name: string): Date {
  if (!isMigrationFileName(name)) throw new Error(`Некорректное имя миграции: ${name}`)
  return parseMigrationFileNameDate(name)
}

function parseMigrationFileNameDate(name: string): Date {
  const yyyy = name.slice(0, 4)
  const mm = name.slice(5, 7)
  const dd = name.slice(8, 10)
  const hh = name.slice(11, 13)
  const min = name.slice(13, 15)
  const ss = name.slice(15, 17)
  return new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}.000Z`)
}

export function formatMigrationFileName(date: Date): string {
  const iso = date.toISOString()
  return `${iso.slice(0, 10)}-${iso.slice(11, 13)}${iso.slice(14, 16)}${iso.slice(17, 19)}.yaml`
}

export function nextMigrationFileName(yamlDir: string, now = new Date()): string {
  const fileNames = listMigrationFileNames(yamlDir)
  const latest = fileNames[fileNames.length - 1]
  if (!latest) return formatMigrationFileName(now)

  const latestPlusOne = new Date(migrationFileNameToDate(latest).getTime() + 1000)
  return formatMigrationFileName(now.getTime() > latestPlusOne.getTime() ? now : latestPlusOne)
}
