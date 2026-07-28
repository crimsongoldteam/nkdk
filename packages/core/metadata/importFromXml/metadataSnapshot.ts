import type { ValidationOwnerFacts } from "../validation/dataPath/ownerFacts"
import type {
  ValidationIndexContribution,
  ValidationObjectRecord,
} from "../validation/projectValidationTypes"
import { createSharedValidationSnapshot, type SharedValidationSnapshot } from "../validation/sharedValidationSnapshot"

export function createImportSharedMetadata(facts: readonly ValidationOwnerFacts[]): SharedValidationSnapshot {
  const records = normalizeUniqueOwnerFacts(facts).map(ownerFactToValidationObjectRecord)
  return createSharedValidationSnapshot({
    records,
    filePaths: [...new Set(records.map((record) => record.filePath))],
    objectIndexEntries: records.flatMap((record) => record.objectIndexEntries ?? []),
    memberIndexEntries: records.flatMap((record) => record.memberIndexEntries ?? []),
    valueIndexEntries: records.flatMap((record) => record.valueIndexEntries ?? []),
  })
}

export function createImportSharedValidationSnapshot(
  contribution: ValidationIndexContribution
): SharedValidationSnapshot {
  assertUniqueOwnerRecords(contribution.objectRecords)
  return createSharedValidationSnapshot({
    records: [...contribution.objectRecords],
    filePaths: [
      ...new Set(
        contribution.objectRecords.map((record) => record.projectPath || record.filePath)
      ),
    ],
    objectIndexEntries: [...contribution.objectIndexEntries],
    memberIndexEntries: [...contribution.memberIndexEntries],
    valueIndexEntries: [...contribution.valueIndexEntries],
    pendingReferences: [...contribution.pendingReferences],
  })
}

function normalizeUniqueOwnerFacts(facts: readonly ValidationOwnerFacts[]): ValidationOwnerFacts[] {
  const byLogicalAddress = new Map<string, ValidationOwnerFacts>()
  for (const fact of facts) {
    const logicalAddress = ownerLogicalAddress(fact)
    if (byLogicalAddress.has(logicalAddress)) {
      throw new Error(`Повторный логический адрес владельца: ${logicalAddress}`)
    }
    byLogicalAddress.set(logicalAddress, fact)
  }
  return [...byLogicalAddress.values()]
}

function assertUniqueOwnerRecords(records: readonly ValidationObjectRecord[]): void {
  const logicalAddresses = new Set<string>()
  for (const record of records) {
    if (record.ownerRef === undefined) continue
    const logicalAddress = ownerRefLogicalAddress(record.ownerRef)
    if (logicalAddresses.has(logicalAddress)) {
      throw new Error(`Повторный логический адрес владельца: ${logicalAddress}`)
    }
    logicalAddresses.add(logicalAddress)
  }
}

function ownerFactToValidationObjectRecord(fact: ValidationOwnerFacts): ValidationObjectRecord {
  const ownerName = fact.ref.name ?? ""
  return {
    filePath: fact.filePath,
    projectPath: fact.filePath,
    kind: "properties",
    owner: { dir: fact.ref.kind, name: ownerName },
    ownerRef: fact.ref,
    ownerFacts: fact,
    fieldIndex: fact.fieldIndex,
    importDiagnostics: [],
  }
}

function ownerLogicalAddress(fact: ValidationOwnerFacts): string {
  return ownerRefLogicalAddress(fact.ref)
}

function ownerRefLogicalAddress(ref: ValidationOwnerFacts["ref"]): string {
  return ref.name === undefined ? ref.kind : `${ref.kind}.${ref.name}`
}
