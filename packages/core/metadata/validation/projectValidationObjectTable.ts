import { resolve } from "path"
import type { OwnerTypeRef } from "./dataPath/types"
import type { ValidationObjectRecord, ValidationObjectTableSnapshot } from "./projectValidationTypes"

export interface ValidationObjectTable {
  mergeRecords(records: readonly ValidationObjectRecord[]): void
  getOwner(ref: OwnerTypeRef): ValidationObjectRecord | undefined
  hasFile(filePath: string): boolean
  snapshot(): ValidationObjectTableSnapshot
}

export function createValidationObjectTable(
  snapshot: ValidationObjectTableSnapshot = { records: [], filePaths: [] }
): ValidationObjectTable {
  const recordsByOwner = new Map<string, ValidationObjectRecord>()
  const filePaths = new Set<string>()

  const table: ValidationObjectTable = {
    mergeRecords(records) {
      for (const record of records) {
        filePaths.add(resolve(record.filePath))
        if (record.ownerRef) recordsByOwner.set(ownerKey(record.ownerRef), record)
      }
    },
    getOwner(ref) {
      return recordsByOwner.get(ownerKey(ref))
    },
    hasFile(filePath) {
      return filePaths.has(resolve(filePath))
    },
    snapshot() {
      const records = [...recordsByOwner.values()]
      return {
        records,
        filePaths: [...filePaths],
        objectIndexEntries: records.flatMap((record) => record.objectIndexEntries ?? []),
        memberIndexEntries: records.flatMap((record) => record.memberIndexEntries ?? []),
        valueIndexEntries: records.flatMap((record) => record.valueIndexEntries ?? []),
        pendingReferences: records.flatMap((record) => record.pendingReferences ?? []),
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
