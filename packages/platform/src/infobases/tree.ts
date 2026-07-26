import { posix, win32 } from "node:path"
import type { PlatformOs } from "../runtime"
import type {
  BuildInfobaseTreeResult,
  InfobaseConnection,
  InfobaseNode,
  InfobaseTreeNode,
  ParsedFolderRecord,
  ParsedInfobaseRecord,
  ParsedRecord,
} from "./types"

type SortKey = {
  orderInTree: number
  sourceOrder: number
  recordOrder: number
}

type InternalInfobaseNode = InfobaseNode & { sort: SortKey }
type InternalFolderNode = {
  kind: "folder"
  name: string
  source: string
  children: InternalTreeNode[]
  sort: SortKey
  explicit: boolean
}
type InternalTreeNode = InternalFolderNode | InternalInfobaseNode

function sortKey(record: ParsedRecord): SortKey {
  return {
    orderInTree: record.orderInTree ?? Number.POSITIVE_INFINITY,
    sourceOrder: record.sourceOrder,
    recordOrder: record.recordOrder,
  }
}

function compareNodes(left: InternalTreeNode, right: InternalTreeNode): number {
  return (
    left.sort.orderInTree - right.sort.orderInTree ||
    left.sort.sourceOrder - right.sort.sourceOrder ||
    left.sort.recordOrder - right.sort.recordOrder
  )
}

function folderPath(value: string): string {
  const normalized = posix.normalize(`/${value}`)
  return normalized === "/" ? "/" : normalized.replace(/\/+$/, "")
}

function childFolderPath(parent: string, name: string): string {
  return folderPath(posix.join(folderPath(parent), name))
}

function connectionKey(connection: InfobaseConnection, os: PlatformOs): string {
  switch (connection.type) {
    case "file": {
      const pathApi = os === "win32" ? win32 : posix
      const normalized = pathApi.normalize(connection.path).replace(/[\\/]+$/, "")
      return `file:${os === "win32" ? normalized.toLowerCase() : normalized}`
    }
    case "server":
      return `server:${connection.server.toLowerCase()}:${connection.reference.toLowerCase()}`
    case "web":
      return `web:${connection.url}`
    case "unknown":
      return `unknown:${connection.raw.trim()}`
  }
}

function filterDuplicates(
  recordsBySource: ReadonlyArray<ReadonlyArray<ParsedRecord>>,
  os: PlatformOs,
): ParsedRecord[] {
  const accepted: ParsedRecord[] = []
  const priorIds = new Set<string>()
  const priorConnections = new Set<string>()

  for (const records of recordsBySource) {
    const currentIds = new Set<string>()
    const currentConnections = new Set<string>()
    for (const record of records) {
      if (record.kind === "folder") {
        accepted.push(record)
        continue
      }
      const id = record.id?.trim().toLowerCase()
      const connection = connectionKey(record.connection, os)
      const duplicate = (id !== undefined && id !== "" && priorIds.has(id)) || priorConnections.has(connection)
      if (!duplicate) accepted.push(record)
      if (id !== undefined && id !== "") currentIds.add(id)
      currentConnections.add(connection)
    }
    for (const id of currentIds) priorIds.add(id)
    for (const connection of currentConnections) priorConnections.add(connection)
  }
  return accepted
}

export function buildInfobaseTree(
  recordsBySource: ReadonlyArray<ReadonlyArray<ParsedInfobaseRecord | ParsedFolderRecord>>,
  options: { os: PlatformOs },
): BuildInfobaseTreeResult {
  const records = filterDuplicates(recordsBySource, options.os)
  const warnings: BuildInfobaseTreeResult["warnings"] = []
  const root: InternalTreeNode[] = []
  const folders = new Map<string, InternalFolderNode>()

  const ensureFolder = (path: string, record: ParsedRecord, explicit = false): InternalFolderNode | undefined => {
    const normalized = folderPath(path)
    if (normalized === "/") return undefined
    const existing = folders.get(normalized)
    if (existing !== undefined) {
      if (explicit && !existing.explicit) {
        existing.explicit = true
        existing.source = record.source
        existing.sort = sortKey(record)
      }
      return existing
    }

    const parentPath = folderPath(posix.dirname(normalized))
    const parent = ensureFolder(parentPath, record)
    const node: InternalFolderNode = {
      kind: "folder",
      name: posix.basename(normalized),
      source: record.source,
      children: [],
      sort: sortKey(record),
      explicit,
    }
    folders.set(normalized, node)
    ;(parent?.children ?? root).push(node)
    if (!explicit) {
      warnings.push({
        code: "implicit-folder",
        source: record.source,
        message: `Неявно создана папка ${normalized}`,
      })
    }
    return node
  }

  for (const record of records) {
    if (record.kind === "folder") ensureFolder(childFolderPath(record.folder, record.name), record, true)
  }

  for (const record of records) {
    if (record.kind === "folder") continue
    const parent = ensureFolder(record.folder, record)
    const node: InternalInfobaseNode = {
      kind: "infobase",
      name: record.name,
      ...(record.id === undefined ? {} : { id: record.id }),
      connection: record.connection,
      rawConnection: record.rawConnection,
      ...(record.version === undefined ? {} : { version: record.version }),
      ...(record.defaultVersion === undefined ? {} : { defaultVersion: record.defaultVersion }),
      ...(record.app === undefined ? {} : { app: record.app }),
      source: record.source,
      sort: sortKey(record),
    }
    ;(parent?.children ?? root).push(node)
  }

  const publish = (nodes: InternalTreeNode[]): InfobaseTreeNode[] =>
    nodes.sort(compareNodes).map((node) => {
      if (node.kind === "folder") {
        return {
          kind: "folder",
          name: node.name,
          source: node.source,
          children: publish(node.children),
        }
      }
      const { sort: _sort, ...published } = node
      return published
    })

  return { tree: publish(root), warnings }
}
