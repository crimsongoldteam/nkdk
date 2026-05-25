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

const DEFAULT_LIMITS: BulkWriteLimits = {
  maxBlobBytes: 256 * 1024 * 1024,
  maxCommandBytes: 768 * 1024 * 1024,
}

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
): Promise<void> => {
  const graphName = graphNameOf(conn)
  for (const command of commands) {
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
}
