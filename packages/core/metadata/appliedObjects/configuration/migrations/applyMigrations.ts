import {
  ADD_ACTION,
  DELETE_ACTION,
  type AppliedMigrationResult,
  type MigrationEntry,
  type MigrationTargetCheck,
  type StructuralNode,
  type StructuralState,
} from "./types"
import { buildRenameTargetPath, parseMigrationPath } from "./paths"
import type { PendingMigrationFile } from "./readMigration"

export function applyMigrationEntries(
  initial: StructuralState,
  entries: MigrationEntry[],
): {
  state: StructuralState
  referencePathByCurrentPath: Map<string, string>
  targetChecks: MigrationTargetCheck[]
} {
  const nodes = cloneNodes(initial.nodes)
  const targetChecks: MigrationTargetCheck[] = []

  for (const entry of entries) {
    if (entry.value === DELETE_ACTION) {
      deletePath(nodes, entry.path)
      targetChecks.push({ path: entry.path, expected: "absent" })
      continue
    }
    if (entry.value === ADD_ACTION) {
      addPath(nodes, entry.path)
      targetChecks.push({ path: entry.path, expected: "exists" })
      continue
    }
    if (typeof entry.value !== "string" || entry.value.length === 0) {
      throw new Error(`Некорректное значение миграции для "${entry.path}"`)
    }
    const targetPath = buildRenameTargetPath(entry.path, entry.value)
    renamePath(nodes, entry.path, targetPath)
    targetChecks.push({ path: entry.path, expected: "absent" }, { path: targetPath, expected: "exists" })
  }

  return {
    state: { nodes },
    referencePathByCurrentPath: new Map(
      [...nodes].flatMap(([path, node]) => (node.referencePath ? [[path, node.referencePath] as const] : [])),
    ),
    targetChecks,
  }
}

export function applyPendingMigrationFiles(initial: StructuralState, files: PendingMigrationFile[]): {
  state: StructuralState
  referencePathByCurrentPath: Map<string, string>
  appliedFileNames: string[]
  targetChecks: MigrationTargetCheck[]
} {
  let current = initial
  let referencePathByCurrentPath = new Map<string, string>()
  const appliedFileNames: string[] = []
  const targetChecks: MigrationTargetCheck[] = []

  for (const file of files) {
    const result = applyMigrationEntries(current, file.entries)
    current = result.state
    referencePathByCurrentPath = result.referencePathByCurrentPath
    targetChecks.push(...result.targetChecks)
    appliedFileNames.push(file.fileName)
  }

  return { state: current, referencePathByCurrentPath, appliedFileNames, targetChecks }
}

export function validateAppliedMigrationTarget(result: AppliedMigrationResult, target: StructuralState): void {
  for (const check of result.targetChecks) {
    if (check.expected === "exists") {
      if (!target.nodes.has(check.path)) throw new Error(`Миграция ожидает путь в YAML "${check.path}"`)
      continue
    }

    if (!target.nodes.has(check.path)) continue
    const migratedNode = result.state.nodes.get(check.path)
    if (migratedNode && migratedNode.referencePath === undefined) continue
    throw new Error(`Миграция ожидает отсутствие пути в YAML "${check.path}"`)
  }
}

function cloneNodes(nodes: Map<string, StructuralNode>): Map<string, StructuralNode> {
  return new Map([...nodes].map(([path, node]) => [path, { ...node }]))
}

function addPath(nodes: Map<string, StructuralNode>, path: string): void {
  if (nodes.has(path)) throw new Error(`Путь для добавления уже существует "${path}"`)
  const parsed = parseMigrationPath(path)
  nodes.set(path, { path, kind: parsed.kind, name: parsed.localName })
}

function deletePath(nodes: Map<string, StructuralNode>, path: string): void {
  if (!nodes.has(path)) throw new Error(`Путь для удаления не найден "${path}"`)
  for (const key of [...nodes.keys()]) {
    if (key === path || key.startsWith(`${path}.`)) nodes.delete(key)
  }
}

function renamePath(nodes: Map<string, StructuralNode>, from: string, to: string): void {
  if (!nodes.has(from)) throw new Error(`Путь для переименования не найден "${from}"`)
  if ([...nodes.keys()].some((path) => path === to || path.startsWith(`${to}.`))) {
    throw new Error(`Целевой путь уже существует "${to}"`)
  }

  const moving = [...nodes.entries()].filter(([path]) => path === from || path.startsWith(`${from}.`))
  for (const [path] of moving) nodes.delete(path)
  for (const [path, node] of moving) {
    const nextPath = path === from ? to : `${to}${path.slice(from.length)}`
    const parsed = parseMigrationPath(nextPath)
    nodes.set(nextPath, { ...node, path: nextPath, name: parsed.localName })
  }
}
