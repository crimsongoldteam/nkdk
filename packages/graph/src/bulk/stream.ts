import {
  bulkValueSignature,
  encodeBulkHeader,
  encodeBulkValue,
} from "./encoder"
import type { BulkEdgeGroup, BulkEdgeRecord, BulkNodeGroup, BulkNodeRecord } from "./plan"
import type { BulkCommand, BulkWriteBlob } from "./write"

export interface BulkTokenLimits {
  maxTokenBytes: number
  maxCommandBytes: number
}

export interface BulkTokenStats {
  commands: number
  nodeBlobs: number
  edgeBlobs: number
  totalBytes: number
}

export interface BulkTokenBuildResult {
  commands: BulkCommand[]
  stats: BulkTokenStats
}

type EntityKind = "node" | "edge"
type RecordWithProps = BulkNodeRecord | BulkEdgeRecord

interface SchemaBucket<T extends RecordWithProps> {
  propertyNames: string[]
  typesByProperty: Map<string, string>
  records: T[]
}

const DEFAULT_LIMITS: BulkTokenLimits = {
  maxTokenBytes: 64 * 1024 * 1024,
  maxCommandBytes: 64 * 1024 * 1024,
}

const commandBytes = (command: BulkCommand): number =>
  command.blobs.reduce((sum, blob) => sum + blob.buffer.byteLength, 0)

const propertyTypeEntries = (props: RecordWithProps["props"]): [string, string][] =>
  Object.entries(props)
    .filter(([, value]) => value !== null)
    .map(([name, value]) => [name, bulkValueSignature(value)] as [string, string])
    .sort(([a], [b]) => a.localeCompare(b))

const canAddToBucket = <T extends RecordWithProps>(
  bucket: SchemaBucket<T>,
  entries: readonly [string, string][],
): boolean =>
  entries.every(([name, signature]) => {
    const existing = bucket.typesByProperty.get(name)
    return existing === undefined || existing === signature
  })

const addToBucket = <T extends RecordWithProps>(
  bucket: SchemaBucket<T>,
  record: T,
  entries: readonly [string, string][],
): void => {
  bucket.records.push(record)
  for (const [name, signature] of entries) {
    if (!bucket.typesByProperty.has(name)) bucket.typesByProperty.set(name, signature)
  }
  bucket.propertyNames = [...bucket.typesByProperty.keys()].sort((a, b) => a.localeCompare(b))
}

const bucketByConflictingTypes = <T extends RecordWithProps>(records: readonly T[]): SchemaBucket<T>[] => {
  const buckets: SchemaBucket<T>[] = []
  let current: SchemaBucket<T> | undefined

  for (const record of records) {
    const entries = propertyTypeEntries(record.props)
    if (current !== undefined && canAddToBucket(current, entries)) {
      addToBucket(current, record, entries)
      continue
    }

    const typesByProperty = new Map(entries)
    current = {
      propertyNames: [...typesByProperty.keys()].sort((a, b) => a.localeCompare(b)),
      typesByProperty,
      records: [record],
    }
    buckets.push(current)
  }

  return buckets
}

const uint64 = (value: number): Buffer => {
  const buffer = Buffer.allocUnsafe(8)
  buffer.writeBigUInt64LE(BigInt(value), 0)
  return buffer
}

const encodeNodeRecord = (record: BulkNodeRecord, propertyNames: readonly string[]): Buffer =>
  Buffer.concat(propertyNames.map((name) => encodeBulkValue(record.props[name] ?? null)))

const encodeEdgeRecord = (record: BulkEdgeRecord, propertyNames: readonly string[]): Buffer =>
  Buffer.concat([
    uint64(record.src),
    uint64(record.tgt),
    ...propertyNames.map((name) => encodeBulkValue(record.props[name] ?? null)),
  ])

const createEmptyCommand = (begin: boolean): BulkCommand => ({
  begin,
  nodeCount: 0,
  edgeCount: 0,
  blobs: [],
})

export const buildBulkTokenCommands = (
  input: { nodeGroups: readonly BulkNodeGroup[]; edgeGroups: readonly BulkEdgeGroup[] },
  limits: Partial<BulkTokenLimits> = {},
): BulkTokenBuildResult => {
  const effective = { ...DEFAULT_LIMITS, ...limits }
  const commands: BulkCommand[] = []
  const stats: BulkTokenStats = { commands: 0, nodeBlobs: 0, edgeBlobs: 0, totalBytes: 0 }
  let current = createEmptyCommand(true)

  const flushCommand = (): void => {
    if (current.blobs.length === 0) return
    commands.push(current)
    current = createEmptyCommand(false)
  }

  const appendBlob = (blob: BulkWriteBlob): void => {
    if (blob.buffer.byteLength > effective.maxTokenBytes) {
      throw new Error(`GRAPH.BULK token ${blob.name} is ${blob.buffer.byteLength} bytes, limit is ${effective.maxTokenBytes} bytes`)
    }
    if (blob.buffer.byteLength > effective.maxCommandBytes) {
      throw new Error(`GRAPH.BULK command part ${blob.name} is ${blob.buffer.byteLength} bytes, limit is ${effective.maxCommandBytes} bytes`)
    }
    if (current.blobs.length > 0 && commandBytes(current) + blob.buffer.byteLength > effective.maxCommandBytes) {
      flushCommand()
    }
    current.blobs.push(blob)
    stats.totalBytes += blob.buffer.byteLength
    if (blob.kind === "node") {
      current.nodeCount += blob.count
      stats.nodeBlobs += 1
    } else {
      current.edgeCount += blob.count
      stats.edgeBlobs += 1
    }
  }

  const appendRecords = <T extends RecordWithProps>(
    kind: EntityKind,
    name: string,
    records: readonly T[],
    encode: (record: T, propertyNames: readonly string[]) => Buffer,
  ): void => {
    for (const bucket of bucketByConflictingTypes(records)) {
      const header = encodeBulkHeader(name, bucket.propertyNames)
      let rows: Buffer[] = []
      let tokenBytes = header.byteLength

      const flushToken = (): void => {
        if (rows.length === 0) return
        appendBlob({ kind, name, count: rows.length, buffer: Buffer.concat([header, ...rows]) })
        rows = []
        tokenBytes = header.byteLength
      }

      for (const record of bucket.records) {
        const row = encode(record, bucket.propertyNames)
        if (header.byteLength + row.byteLength > effective.maxTokenBytes) {
          throw new Error(`GRAPH.BULK record ${name} is ${header.byteLength + row.byteLength} bytes, limit is ${effective.maxTokenBytes} bytes`)
        }
        if (rows.length > 0 && tokenBytes + row.byteLength > effective.maxTokenBytes) flushToken()
        rows.push(row)
        tokenBytes += row.byteLength
      }
      flushToken()
    }
  }

  for (const group of input.nodeGroups) {
    appendRecords("node", group.label, group.nodes, encodeNodeRecord)
  }
  for (const group of input.edgeGroups) {
    appendRecords("edge", group.kind, group.edges, encodeEdgeRecord)
  }
  flushCommand()
  stats.commands = commands.length
  return { commands, stats }
}
