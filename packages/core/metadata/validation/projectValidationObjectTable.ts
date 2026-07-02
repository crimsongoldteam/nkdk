import { resolve } from "path"
import type { OwnerTypeRef } from "./dataPath/types"
import type {
  ValidationObjectRecord,
  ValidationObjectTableSnapshot,
  ValidationReferenceIndexEntries,
} from "./projectValidationTypes"

export interface ValidationObjectTable {
  mergeRecords(records: readonly ValidationObjectRecord[]): void
  mergeReferenceIndexEntries(entries: ValidationReferenceIndexEntries): void
  getOwner(ref: OwnerTypeRef): ValidationObjectRecord | undefined
  hasFile(filePath: string): boolean
  snapshot(): ValidationObjectTableSnapshot
}

export function createValidationObjectTable(
  snapshot: ValidationObjectTableSnapshot = { records: [], filePaths: [] }
): ValidationObjectTable {
  const recordsByOwner = new Map<string, ValidationObjectRecord>()
  const filePaths = new Set<string>()
  const objectIndexEntries = excludeEntriesFromRecords(
    snapshot.objectIndexEntries ?? [],
    snapshot.records.flatMap((record) => record.objectIndexEntries ?? [])
  )
  const memberIndexEntries = excludeEntriesFromRecords(
    snapshot.memberIndexEntries ?? [],
    snapshot.records.flatMap((record) => record.memberIndexEntries ?? [])
  )
  const valueIndexEntries = excludeEntriesFromRecords(
    snapshot.valueIndexEntries ?? [],
    snapshot.records.flatMap((record) => record.valueIndexEntries ?? [])
  )
  const pendingReferences = excludeEntriesFromRecords(
    snapshot.pendingReferences ?? [],
    snapshot.records.flatMap((record) => record.pendingReferences ?? [])
  )

  const table: ValidationObjectTable = {
    mergeRecords(records) {
      for (const record of records) {
        filePaths.add(resolve(record.filePath))
        if (record.ownerRef) recordsByOwner.set(ownerKey(record.ownerRef), record)
      }
    },
    mergeReferenceIndexEntries(entries) {
      appendEntries(objectIndexEntries, entries.objectIndexEntries)
      appendEntries(memberIndexEntries, entries.memberIndexEntries)
      appendEntries(valueIndexEntries, entries.valueIndexEntries)
      appendEntries(pendingReferences, entries.pendingReferences)
    },
    getOwner(ref) {
      return recordsByOwner.get(ownerKey(ref))
    },
    hasFile(filePath) {
      return filePaths.has(resolve(filePath))
    },
    snapshot() {
      const records = [...recordsByOwner.values()]
      const recordObjectIndexEntries = records.flatMap((record) => record.objectIndexEntries ?? [])
      const recordMemberIndexEntries = records.flatMap((record) => record.memberIndexEntries ?? [])
      const recordValueIndexEntries = records.flatMap((record) => record.valueIndexEntries ?? [])
      const recordPendingReferences = records.flatMap((record) => record.pendingReferences ?? [])
      return {
        records,
        filePaths: [...filePaths],
        objectIndexEntries: recordObjectIndexEntries.concat(
          excludeEntriesFromRecords(objectIndexEntries, recordObjectIndexEntries)
        ),
        memberIndexEntries: recordMemberIndexEntries.concat(
          excludeEntriesFromRecords(memberIndexEntries, recordMemberIndexEntries)
        ),
        valueIndexEntries: recordValueIndexEntries.concat(
          excludeEntriesFromRecords(valueIndexEntries, recordValueIndexEntries)
        ),
        pendingReferences: recordPendingReferences.concat(
          excludeEntriesFromRecords(pendingReferences, recordPendingReferences)
        ),
      }
    },
  }

  table.mergeRecords(snapshot.records)
  for (const filePath of snapshot.filePaths) {
    filePaths.add(resolve(filePath))
  }
  return table
}

function ownerKey(ref: OwnerTypeRef): string {
  return `${ref.kind}:${ref.name ?? ""}`
}

function appendEntries<T>(target: T[], entries: readonly T[] | undefined): void {
  if (entries === undefined) return
  for (const entry of entries) target.push(entry)
}

function excludeEntriesFromRecords<T extends { canonical?: string }>(
  entries: readonly T[],
  recordEntries: readonly T[]
): T[] {
  const recordKeys = new Set(
    recordEntries.map((entry) => entry.canonical).filter((key): key is string => key !== undefined)
  )
  return entries.filter((entry) => entry.canonical === undefined || !recordKeys.has(entry.canonical))
}
