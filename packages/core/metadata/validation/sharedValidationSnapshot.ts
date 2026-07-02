import {
  createSharedProjectReferenceSnapshot,
  type SharedProjectReferenceSnapshot,
} from "./sharedProjectReferenceIndex"
import { createBinarySharedOwnersSnapshot, type BinarySharedOwnersSnapshot } from "./sharedValidationBinaryOwners"
import type { ValidationObjectTableSnapshot } from "./projectValidationTypes"

export interface SharedValidationSnapshot {
  reference: SharedProjectReferenceSnapshot
  owners: BinarySharedOwnersSnapshot
}

export function createSharedValidationSnapshot(snapshot: ValidationObjectTableSnapshot): SharedValidationSnapshot {
  if (!Array.isArray(snapshot.records)) {
    throw new Error(
      `Некорректный ValidationObjectTableSnapshot для shared validation: keys=${Object.keys(snapshot as object).join(",")} records=${typeof snapshot.records}`
    )
  }

  return {
    reference: createSharedProjectReferenceSnapshot({
      objectIndexEntries: snapshot.objectIndexEntries ?? [],
      memberIndexEntries: snapshot.memberIndexEntries ?? [],
      valueIndexEntries: snapshot.valueIndexEntries ?? [],
    }),
    owners: createBinarySharedOwnersSnapshot(snapshot),
  }
}
