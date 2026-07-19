import type { ValidationOwnerFacts } from "../validation/dataPath/ownerFacts"
import type { ValidationObjectRecord } from "../validation/projectValidationTypes"
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
  return fact.ref.name === undefined ? fact.ref.kind : `${fact.ref.kind}.${fact.ref.name}`
}
