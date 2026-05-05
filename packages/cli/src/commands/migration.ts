import fs from "fs"
import { select } from "@inquirer/prompts"
import {
  ADD_ACTION,
  DELETE_ACTION,
  applyPendingMigrationFiles,
  buildRenameTargetPath,
  collectStructuralStateFromXML,
  collectStructuralStateFromYAML,
  detectMigrationConflicts,
  readAppliedMigrationsState,
  readPendingMigrationEntries,
  validateAppliedMigrationTarget,
  writeMigrationFile,
  type MigrationConflict,
  type MigrationEntry,
  type StructuralState,
} from "@nakidka/core"

export function renameMigration(yamlDir: string, path: string, newName: string, now = new Date()): void {
  if (path.length === 0) throw new Error("Путь не должен быть пустым")
  if (newName.length === 0) throw new Error("Новое имя не должно быть пустым")
  buildRenameTargetPath(path, newName)
  const filePath = writeMigrationFile({ yamlDir, now, entries: [{ path, value: newName }] })
  process.stdout.write(filePath + "\n")
}

export function deleteMigration(yamlDir: string, path: string, now = new Date()): void {
  if (path.length === 0) throw new Error("Путь не должен быть пустым")
  const filePath = writeMigrationFile({ yamlDir, now, entries: [{ path, value: DELETE_ACTION }] })
  process.stdout.write(filePath + "\n")
}

export interface GenerateMigrationResult {
  exitCode: number
  conflicts: MigrationConflict[]
  filePath?: string
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

  const filePath = writeMigrationFile({ yamlDir: params.yamlDir, entries, now: params.now })
  process.stdout.write(filePath + "\n")
  return { exitCode: 0, conflicts, filePath }
}

async function resolveConflictsInteractively(initial: StructuralState, target: StructuralState): Promise<MigrationEntry[]> {
  let current = initial
  const entries: MigrationEntry[] = []

  while (true) {
    const conflict = detectMigrationConflicts(current, target)[0]
    if (!conflict) return entries

    const chunk: MigrationEntry[] = []
    const availableAdded = [...conflict.added]
    for (const deleted of conflict.deleted) {
      const choice = await select<string>({
        message: `${conflict.levelPath}.${deleted}`,
        choices: [
          ...availableAdded.map((name) => ({ name, value: name })),
          { name: DELETE_ACTION, value: DELETE_ACTION },
        ],
      })
      const fullPath = `${conflict.levelPath}.${deleted}`
      chunk.push({ path: fullPath, value: choice })
      if (choice !== DELETE_ACTION) availableAdded.splice(availableAdded.indexOf(choice), 1)
    }
    for (const added of availableAdded) chunk.push({ path: `${conflict.levelPath}.${added}`, value: ADD_ACTION })

    entries.push(...chunk)
    current = applyPendingMigrationFiles(current, [{ fileName: "generated.yaml", entries: chunk }]).state
  }
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

export { ADD_ACTION }
