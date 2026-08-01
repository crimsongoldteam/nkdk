import { serialize } from "node:v8"

export const SQLITE_FIRST_PASS_EXPERIMENT_FORMAT_VERSION = 1
export const SQLITE_FIRST_PASS_EXPERIMENT_BATCH_BYTES = 4 * 1024 * 1024
export const SQLITE_FIRST_PASS_EXPERIMENT_MAX_IN_FLIGHT = 2

export interface SqliteFirstPassExperimentFileInput {
  readonly componentPath: string
  readonly rootProjectPath: string
  readonly contributedFacts: boolean
  readonly diagnostics: readonly unknown[]
  readonly objectRecords: readonly unknown[]
  readonly objectIndexEntries: readonly unknown[]
  readonly memberIndexEntries: readonly unknown[]
  readonly valueIndexEntries: readonly unknown[]
  readonly pendingReferences: readonly unknown[]
  readonly pendingChecks: readonly unknown[]
}

export interface SqliteFirstPassExperimentCounts {
  readonly diagnostics: number
  readonly objectRecords: number
  readonly objectIndexEntries: number
  readonly memberIndexEntries: number
  readonly valueIndexEntries: number
  readonly pendingReferences: number
  readonly pendingChecks: number
}

export interface SqliteFirstPassExperimentFileRecord {
  readonly formatVersion: 1
  readonly componentPath: string
  readonly rootProjectPath: string
  readonly contributedFacts: boolean
  readonly diagnostics: Uint8Array
  readonly objectRecords: Uint8Array
  readonly objectIndexEntries: Uint8Array
  readonly memberIndexEntries: Uint8Array
  readonly valueIndexEntries: Uint8Array
  readonly pendingReferences: Uint8Array
  readonly pendingChecks: Uint8Array
  readonly counts: SqliteFirstPassExperimentCounts
  readonly bytes: number
}

export interface SqliteFirstPassExperimentStoreStats
  extends SqliteFirstPassExperimentCounts {
  readonly files: number
  readonly payloadBytes: number
  readonly databaseBytes: number
  readonly insertMs: number
  readonly commitMs: number
  readonly quickCheckMs: number
  readonly quickCheck: "ok"
}

export interface SqliteFirstPassExperimentTransportStats {
  readonly batches: number
  readonly producerWaitMs: number
  readonly maxInFlightBatches: number
}

export type SqliteFirstPassExperimentStats =
  SqliteFirstPassExperimentStoreStats & SqliteFirstPassExperimentTransportStats

export function encodeSqliteFirstPassExperimentFile(
  input: SqliteFirstPassExperimentFileInput,
): SqliteFirstPassExperimentFileRecord {
  const diagnostics = serialize(input.diagnostics)
  const objectRecords = serialize(input.objectRecords)
  const objectIndexEntries = serialize(input.objectIndexEntries)
  const memberIndexEntries = serialize(input.memberIndexEntries)
  const valueIndexEntries = serialize(input.valueIndexEntries)
  const pendingReferences = serialize(input.pendingReferences)
  const pendingChecks = serialize(input.pendingChecks)
  const payloads = [
    diagnostics,
    objectRecords,
    objectIndexEntries,
    memberIndexEntries,
    valueIndexEntries,
    pendingReferences,
    pendingChecks,
  ]

  return {
    formatVersion: SQLITE_FIRST_PASS_EXPERIMENT_FORMAT_VERSION,
    componentPath: input.componentPath,
    rootProjectPath: input.rootProjectPath,
    contributedFacts: input.contributedFacts,
    diagnostics,
    objectRecords,
    objectIndexEntries,
    memberIndexEntries,
    valueIndexEntries,
    pendingReferences,
    pendingChecks,
    counts: {
      diagnostics: input.diagnostics.length,
      objectRecords: input.objectRecords.length,
      objectIndexEntries: input.objectIndexEntries.length,
      memberIndexEntries: input.memberIndexEntries.length,
      valueIndexEntries: input.valueIndexEntries.length,
      pendingReferences: input.pendingReferences.length,
      pendingChecks: input.pendingChecks.length,
    },
    bytes: payloads.reduce((total, payload) => total + payload.byteLength, 0),
  }
}
