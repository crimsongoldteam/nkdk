import {
  createSharedProjectReferenceSnapshot,
  createSharedProjectReferenceSnapshotFromGraph,
  type SharedProjectReferenceSnapshot,
} from "./sharedProjectReferenceIndex"
import {
  createBinarySharedOwnersSnapshot,
  createBinarySharedProjectOwnersSnapshot,
  type BinarySharedOwnersSnapshot,
} from "./sharedValidationBinaryOwners"
import type { ProjectValidationGraph, ValidationObjectTableSnapshot } from "./projectValidationTypes"

export interface SharedValidationSnapshot {
  reference: SharedProjectReferenceSnapshot
  owners: BinarySharedOwnersSnapshot
}

export interface SharedProjectValidationGraph {
  reference: SharedProjectReferenceSnapshot
  owners: BinarySharedOwnersSnapshot
}

export function createSharedProjectValidationGraph(graph: ProjectValidationGraph): SharedProjectValidationGraph {
  return {
    reference: createSharedProjectReferenceSnapshotFromGraph(graph),
    owners: createBinarySharedProjectOwnersSnapshot(graph),
  }
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
