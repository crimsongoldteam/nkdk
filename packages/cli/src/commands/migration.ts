import fs from "fs"
import { select } from "@inquirer/prompts"
import {
  applyPendingMigrationFiles,
  collectStructuralStateFromXML,
  collectStructuralStateFromYAML,
  deleteMetadataItem,
  detectMigrationConflicts,
  readAppliedMigrationsState,
  readPendingMigrationEntries,
  renameMetadataItem,
  validateAppliedMigrationTarget,
  writeMigrationFile,
  type MetadataOperationResult,
  type MigrationConflict,
  type MigrationEntry,
  type StructuralState,
} from "@nakidka/core"

export function renameMigration(yamlDir: string, path: string, newName: string, allowWrite = false): void {
  printOperationResult(renameMetadataItem({
    projectDir: yamlDir,
    path,
    newName,
    allowWrite,
  }))
}

export function deleteMigration(yamlDir: string, path: string, allowWrite = false): void {
  printOperationResult(deleteMetadataItem({
    projectDir: yamlDir,
    path,
    allowWrite,
  }))
}

export interface GenerateMigrationResult {
  exitCode: number
  conflicts: MigrationConflict[]
  filePath?: string
  filePaths?: string[]
}

export async function generateMigration(params: {
  yamlDir: string
  xmlDir: string
  dryRun: boolean
  now?: Date
}): Promise<GenerateMigrationResult> {
  if (!fs.existsSync(params.yamlDir)) throw new Error(`YAML-каталог не найден: ${params.yamlDir}`)
  if (!fs.existsSync(params.xmlDir)) throw new Error(`XML-каталог не найден: ${params.xmlDir}`)

  const appliedState = readAppliedMigrationsState(params.xmlDir)
  const pending = readPendingMigrationEntries(params.yamlDir, appliedState)
  const referenceState = await collectStructuralStateFromXML({ xmlDir: params.xmlDir, context: makeFromXMLContext() })
  const yamlState = await collectStructuralStateFromYAML({ yamlDir: params.yamlDir, context: makeToXMLContext() })
  const migrated = applyPendingMigrationFiles(referenceState, pending)
  validateAppliedMigrationTarget(migrated, yamlState)
  const conflicts = detectMigrationConflicts(migrated.state, yamlState)

  if (conflicts.length === 0) return { exitCode: 0, conflicts: [] }
  if (params.dryRun) return { exitCode: 1, conflicts }

  const entries = await resolveConflictsInteractively(migrated.state, yamlState)
  if (entries.length === 0) return { exitCode: 0, conflicts }

  const filePaths = entries.map((entry) => writeMigrationFile({ yamlDir: params.yamlDir, entries: [entry], now: params.now }))
  for (const filePath of filePaths) process.stdout.write(filePath + "\n")
  return { exitCode: 0, conflicts, filePath: filePaths[0], filePaths }
}

async function resolveConflictsInteractively(initial: StructuralState, target: StructuralState): Promise<MigrationEntry[]> {
  let current = initial
  const entries: MigrationEntry[] = []
  const skipped = new Set<string>()

  while (true) {
    const conflict = nextConflict(current, target, skipped)
    if (!conflict) return entries

    const chunk: MigrationEntry[] = []
    const availableAdded = [...conflict.added]
    for (const deleted of conflict.deleted) {
      const choice = await select<string>({
        message: `${conflict.levelPath}.${deleted}`,
        choices: [
          ...availableAdded.map((name) => ({ name, value: name })),
          { name: "Не переименовывать", value: "" },
        ],
      })
      const fullPath = `${conflict.levelPath}.${deleted}`
      if (choice === "") {
        skipped.add(fullPath)
        continue
      }
      chunk.push({ path: fullPath, value: choice })
      availableAdded.splice(availableAdded.indexOf(choice), 1)
    }

    if (chunk.length === 0) continue
    entries.push(...chunk)
    current = applyPendingMigrationFiles(current, [{ fileName: "generated.yaml", entries: chunk }]).state
  }
}

function nextConflict(current: StructuralState, target: StructuralState, skipped: Set<string>): MigrationConflict | undefined {
  for (const conflict of detectMigrationConflicts(current, target)) {
    const deleted = conflict.deleted.filter((name) => !skipped.has(`${conflict.levelPath}.${name}`))
    if (deleted.length === 0) continue
    return { ...conflict, deleted }
  }
  return undefined
}

function printOperationResult(result: MetadataOperationResult): void {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  if (!result.ok) process.exitCode = 1
}

function makeFromXMLContext() {
  return { defaultLanguage: "ru", version: "2.20", fromXML: { forReference: true } }
}

function makeToXMLContext() {
  return {
    defaultLanguage: "ru",
    version: "2.20",
    exportToYAML: { toTyped: false },
    exportToXML: {
      itemsTree: [],
      configDumpInfo: new Map(),
      version: "2.20",
      context: {
        forms: [],
        templates: [],
        parentName: "",
        metadataForNumbering: [],
      },
    },
  }
}
