import { graphNameOf, rawCommand } from "../internal/connection"
import type { GraphConnection } from "../internal/connection"

export interface BulkWriteLimits {
  maxBlobBytes: number
  maxCommandBytes: number
}

export interface BulkWriteBlob {
  kind: "node" | "edge"
  name: string
  count: number
  buffer: Buffer
}

export interface BulkCommand {
  begin: boolean
  nodeCount: number
  edgeCount: number
  blobs: BulkWriteBlob[]
}

export interface BulkWriteStats {
  commands: number
  nodeBlobs: number
  edgeBlobs: number
  totalBytes: number
}

export interface BulkWriteOptions {
  concurrency?: number
}

const DEFAULT_LIMITS: BulkWriteLimits = {
  maxBlobBytes: 256 * 1024 * 1024,
  maxCommandBytes: 64 * 1024 * 1024,
}
const DEFAULT_CONCURRENCY = 5

const commandBytes = (command: BulkCommand): number =>
  command.blobs.reduce((sum, blob) => sum + blob.buffer.byteLength, 0)

export const buildBulkCommands = (
  blobs: readonly BulkWriteBlob[],
  limits: Partial<BulkWriteLimits> = {},
): BulkCommand[] => {
  const effective = {
    maxBlobBytes: limits.maxBlobBytes ?? DEFAULT_LIMITS.maxBlobBytes,
    maxCommandBytes: limits.maxCommandBytes ?? DEFAULT_LIMITS.maxCommandBytes,
  }
  const commands: BulkCommand[] = []
  let current: BulkCommand = { begin: true, nodeCount: 0, edgeCount: 0, blobs: [] }

  const flush = (): void => {
    if (current.blobs.length === 0) return
    commands.push(current)
    current = { begin: false, nodeCount: 0, edgeCount: 0, blobs: [] }
  }

  for (const blob of blobs) {
    if (blob.buffer.byteLength > effective.maxBlobBytes) {
      throw new Error(`GRAPH.BULK blob ${blob.name} is ${blob.buffer.byteLength} bytes, limit is ${effective.maxBlobBytes} bytes`)
    }
    if (current.blobs.length > 0 && commandBytes(current) + blob.buffer.byteLength > effective.maxCommandBytes) {
      flush()
    }
    current.blobs.push(blob)
    if (blob.kind === "node") current.nodeCount += blob.count
    else current.edgeCount += blob.count
  }
  flush()
  return commands
}

export const writeBulkCommands = async (
  conn: GraphConnection,
  commands: readonly BulkCommand[],
  opts: BulkWriteOptions = {},
): Promise<BulkWriteStats> => {
  const graphName = graphNameOf(conn)
  const concurrency = opts.concurrency ?? DEFAULT_CONCURRENCY
  const stats: BulkWriteStats = {
    commands: commands.length,
    nodeBlobs: commands.reduce((sum, command) => sum + command.blobs.filter((blob) => blob.kind === "node").length, 0),
    edgeBlobs: commands.reduce((sum, command) => sum + command.blobs.filter((blob) => blob.kind === "edge").length, 0),
    totalBytes: commands.reduce((sum, command) => sum + commandBytes(command), 0),
  }

  const send = async (command: BulkCommand): Promise<void> => {
    const nodeBlobs = command.blobs.filter((blob) => blob.kind === "node")
    const edgeBlobs = command.blobs.filter((blob) => blob.kind === "edge")
    const args = [
      "GRAPH.BULK",
      graphName,
      ...(command.begin ? ["BEGIN"] : []),
      String(command.nodeCount),
      String(command.edgeCount),
      String(nodeBlobs.length),
      String(edgeBlobs.length),
      ...nodeBlobs.map((blob) => blob.buffer),
      ...edgeBlobs.map((blob) => blob.buffer),
    ]
    await rawCommand(conn, args)
  }

  for (let i = 0; i < commands.length; i += concurrency) {
    await Promise.all(commands.slice(i, i + concurrency).map(send))
  }
  return stats
}
