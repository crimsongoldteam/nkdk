import fs from "fs"
import { join } from "path"
import { parse } from "yaml"
import {
  APPLIED_MIGRATIONS_FILE,
  MIGRATIONS_DIR,
  type AppliedMigrationsState,
} from "~/metadata/appliedObjects/configuration/migrations"
import { isMigrationFileName } from "~/metadata/appliedObjects/configuration/migrations/fileNames"
import { buildRenameTargetPath } from "~/metadata/appliedObjects/configuration/migrations/paths"
import type { XmlSyncArea } from "~/metadata/orchestration/appliedObject/xmlAreas"
import type { MigrationChainError, MigrationChainInvalidResult, MigrationPlanItem } from "./types"

export interface PreparedMetadataMigrationChain {
  ok: true
  appliedState: AppliedMigrationsState
  pendingFileNames: string[]
  migrationsToApply: MigrationPlanItem[]
  referencePathByCurrentPath: Map<string, string>
  xmlAreas: XmlSyncArea[]
}

export interface PrepareMetadataMigrationChainParams {
  yamlDir: string
  xmlDir: string
  referencePaths: string[]
  yamlPaths: string[]
  xmlAreaByMigrationPath: (path: string) => XmlSyncArea | undefined
}

interface PendingMigrationFile {
  fileName: string
  path: string
  value: string
}

export function prepareMetadataMigrationChain(
  params: PrepareMetadataMigrationChainParams,
): PreparedMetadataMigrationChain | MigrationChainInvalidResult {
  const errors: MigrationChainError[] = []
  const appliedState = readAppliedStateStrict(params.xmlDir, errors)
  const pending = readPendingMigrationFilesStrict(params.yamlDir, appliedState.applied, errors)
  if (errors.length > 0) return invalid(errors)

  const current = new Map(params.referencePaths.map((path) => [path, path]))
  const claimsByReference = new Map<string, { fileName: string; finalPath: string }>()
  const migrationsToApply: MigrationPlanItem[] = []

  for (const file of pending) {
    const targetPath = buildRenameTargetPathStrict(file, errors)
    if (targetPath === undefined) continue

    const referencePath = current.get(file.path)
    if (referencePath === undefined) {
      errors.push({
        fileName: file.fileName,
        code: "missing_source_path",
        message: `Исходный путь не найден: ${file.path}`,
        path: file.path,
      })
      continue
    }
    if (targetPath === file.path) {
      errors.push({
        fileName: file.fileName,
        code: "noop_migration",
        message: `Переименование в то же имя запрещено: ${file.path}`,
        path: file.path,
        value: file.value,
      })
      continue
    }
    if (current.has(targetPath) || [...current.keys()].some((path) => path.startsWith(`${targetPath}.`))) {
      errors.push({
        fileName: file.fileName,
        code: "name_conflict",
        message: `Целевой путь уже существует: ${targetPath}`,
        path: file.path,
        value: file.value,
      })
      continue
    }
    const existingClaim = claimsByReference.get(referencePath)
    if (existingClaim) {
      errors.push({
        fileName: file.fileName,
        conflictingFileName: existingClaim.fileName,
        code: existingClaim.finalPath === targetPath ? "duplicate_migration" : "same_reference_conflict",
        message: `Повторная миграция identity ${referencePath}`,
        path: file.path,
        value: file.value,
      })
      continue
    }

    movePathWithDescendants(current, file.path, targetPath)
    claimsByReference.set(referencePath, { fileName: file.fileName, finalPath: targetPath })
    migrationsToApply.push({ fileName: file.fileName, from: file.path, to: targetPath })
  }

  if (errors.length === 0) validateMigrationTargetsExist(migrationsToApply, params.yamlPaths, errors)
  const xmlAreas = errors.length === 0 ? collectXmlAreas(migrationsToApply, params.xmlAreaByMigrationPath, errors) : []
  if (errors.length > 0) return invalid(errors)

  const referencePathByCurrentPath = new Map<string, string>()
  for (const [currentPath, referencePath] of current) {
    if (currentPath !== referencePath) referencePathByCurrentPath.set(currentPath, referencePath)
  }

  return {
    ok: true,
    appliedState,
    pendingFileNames: pending.map((file) => file.fileName),
    migrationsToApply,
    referencePathByCurrentPath,
    xmlAreas,
  }
}

function readAppliedStateStrict(xmlDir: string, errors: MigrationChainError[]): AppliedMigrationsState {
  const path = join(xmlDir, APPLIED_MIGRATIONS_FILE)
  if (!fs.existsSync(path)) return { applied: [] }

  try {
    const parsed = parse(fs.readFileSync(path, "utf-8")) as unknown
    if (!isRecord(parsed)) throw new Error(`${APPLIED_MIGRATIONS_FILE}: ожидается YAML-словарь`)
    if (!Array.isArray(parsed.applied)) throw new Error(`${APPLIED_MIGRATIONS_FILE}: поле applied должно быть списком`)

    const seen = new Set<string>()
    const applied: string[] = []
    for (const name of parsed.applied) {
      if (typeof name !== "string" || !isMigrationFileName(name)) {
        throw new Error(`Некорректное имя применённой миграции "${String(name)}"`)
      }
      if (seen.has(name)) throw new Error(`Дубликат применённой миграции "${name}"`)
      seen.add(name)
      applied.push(name)
    }
    return { applied }
  } catch (caught) {
    errors.push({
      code: "invalid_applied_migrations_state",
      message: caught instanceof Error ? caught.message : String(caught),
      path,
    })
    return { applied: [] }
  }
}

function readPendingMigrationFilesStrict(
  yamlDir: string,
  appliedFileNames: readonly string[],
  errors: MigrationChainError[],
): PendingMigrationFile[] {
  const dir = join(yamlDir, MIGRATIONS_DIR)
  if (!fs.existsSync(dir)) return []

  const applied = new Set(appliedFileNames)
  const pending: PendingMigrationFile[] = []
  const fileNames = fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (!entry.isFile() || !entry.name.endsWith(".yaml")) return []
    if (!isMigrationFileName(entry.name)) {
      errors.push({
        fileName: entry.name,
        code: "invalid_migration_file_name",
        message: `Некорректное имя файла миграции: ${entry.name}`,
      })
      return []
    }
    return [entry.name]
  })

  for (const fileName of fileNames.sort((left, right) => left.localeCompare(right, "ru"))) {
    if (applied.has(fileName)) continue
    const filePath = join(dir, fileName)
    const file = readPendingMigrationFileStrict(filePath, fileName, errors)
    if (file) pending.push(file)
  }

  return pending
}

function readPendingMigrationFileStrict(
  filePath: string,
  fileName: string,
  errors: MigrationChainError[],
): PendingMigrationFile | undefined {
  try {
    const parsed = parse(fs.readFileSync(filePath, "utf-8")) as unknown
    if (!isRecord(parsed)) throw new Error("Файл миграции должен быть YAML-словарём")
    const entries = Object.entries(parsed)
    if (entries.length !== 1) throw new Error("Файл миграции должен содержать ровно одно переименование")
    const [path, value] = entries[0]!
    if (typeof value !== "string" || value.length === 0) throw new Error("Значение миграции должно быть непустой строкой")
    if (!isValidMetadataLocalName(value) || value.includes(".")) {
      throw new Error("Значение миграции должно быть локальным именем без точки")
    }
    return { fileName, path, value }
  } catch (caught) {
    errors.push({
      fileName,
      code: "invalid_migration_file",
      message: caught instanceof Error ? caught.message : String(caught),
      path: filePath,
    })
    return undefined
  }
}

function buildRenameTargetPathStrict(
  file: PendingMigrationFile,
  errors: MigrationChainError[],
): string | undefined {
  try {
    return buildRenameTargetPath(file.path, file.value)
  } catch (caught) {
    errors.push({
      fileName: file.fileName,
      code: "invalid_migration_file",
      message: caught instanceof Error ? caught.message : String(caught),
      path: file.path,
      value: file.value,
    })
    return undefined
  }
}

function movePathWithDescendants(current: Map<string, string>, from: string, to: string): void {
  const moved: Array<[string, string]> = []
  for (const [currentPath, referencePath] of current) {
    if (currentPath === from || currentPath.startsWith(`${from}.`)) {
      moved.push([`${to}${currentPath.slice(from.length)}`, referencePath])
      current.delete(currentPath)
    }
  }
  for (const [currentPath, referencePath] of moved) current.set(currentPath, referencePath)
}

function validateMigrationTargetsExist(
  migrationsToApply: readonly MigrationPlanItem[],
  yamlPaths: readonly string[],
  errors: MigrationChainError[],
): void {
  const yaml = new Set(yamlPaths)
  for (const migration of migrationsToApply) {
    if (!yaml.has(migration.to)) {
      errors.push({
        code: "missing_source_path",
        message: `Итоговый путь миграции отсутствует в YAML: ${migration.to}`,
        fileName: migration.fileName,
        path: migration.to,
      })
    }
  }
}

function collectXmlAreas(
  migrationsToApply: readonly MigrationPlanItem[],
  xmlAreaByMigrationPath: (path: string) => XmlSyncArea | undefined,
  errors: MigrationChainError[],
): XmlSyncArea[] {
  const areas = new Map<string, XmlSyncArea>()
  for (const migration of migrationsToApply) {
    const area = xmlAreaByMigrationPath(migration.to)
    if (!area) {
      errors.push({
        fileName: migration.fileName,
        code: "missing_incremental_sync_rule",
        message: `Нет XML-области для ${migration.to}`,
        path: migration.to,
      })
      continue
    }
    areas.set(xmlAreaKey(area), area)
  }

  return [...areas.values()]
}

function xmlAreaKey(area: XmlSyncArea): string {
  if (area.kind === "owner") return `owner:${area.itemTypePrefix}/${area.itemName}`
  if (area.kind === "fileItem") return `fileItem:${area.itemTypePrefix}/${area.itemName}/${area.propertyName}`
  return `externalFile:${area.xmlPath}`
}

function invalid(errors: MigrationChainError[]): MigrationChainInvalidResult {
  return {
    ok: false,
    code: "migration_chain_invalid",
    message: "Цепочка миграций некорректна",
    migrationErrors: errors,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isValidMetadataLocalName(value: string): boolean {
  return /^[A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё0-9_]*$/.test(value)
}
