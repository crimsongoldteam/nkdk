import { ADD_ACTION, DELETE_ACTION, type MigrationEntry, type StructuralNode, type StructuralState } from "./types"
import { buildRenameTargetPath, parseMigrationPath } from "./paths"

export function applyMigrationEntries(
  initial: StructuralState,
  entries: MigrationEntry[],
): {
  state: StructuralState
  referencePathByCurrentPath: Map<string, string>
} {
  const nodes = cloneNodes(initial.nodes)

  for (const entry of entries) {
    if (entry.value === DELETE_ACTION) {
      deletePath(nodes, entry.path)
      continue
    }
    if (entry.value === ADD_ACTION) {
      addPath(nodes, entry.path)
      continue
    }
    if (typeof entry.value !== "string" || entry.value.length === 0) {
      throw new Error(`Некорректное значение миграции для "${entry.path}"`)
    }
    renamePath(nodes, entry.path, buildRenameTargetPath(entry.path, entry.value))
  }

  return {
    state: { nodes },
    referencePathByCurrentPath: new Map(
      [...nodes].flatMap(([path, node]) => (node.referencePath ? [[path, node.referencePath] as const] : [])),
    ),
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
