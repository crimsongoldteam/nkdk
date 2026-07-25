import { describe, expect, it } from "vitest"
import { parseMetadataTargetFromYAML } from "../commonObjects/metadataTargets"
import type { ValidationOwnerFacts } from "../validation/dataPath/ownerFacts"
import { projectObjectIndexKey } from "../validation/projectReferenceIndex"
import {
  createImportSharedMetadata,
  createImportSharedValidationSnapshot,
} from "./metadataSnapshot"

describe("createImportSharedMetadata", () => {
  it("builds one immutable shared snapshot for all workers", () => {
    const snapshot = createImportSharedMetadata(sampleOwnerFacts())

    expect(snapshot.owners.table).toBeInstanceOf(SharedArrayBuffer)
    expect(snapshot.owners.strings.buffer).toBeInstanceOf(SharedArrayBuffer)
    expect(snapshot.reference.buffer).toBeInstanceOf(SharedArrayBuffer)
  })

  it("rejects duplicate logical owners before second pass", () => {
    const fact = sampleOwnerFacts()[0]
    if (fact === undefined) throw new Error("Ожидались факты владельца")

    expect(() => createImportSharedMetadata([fact, fact])).toThrow("Повторный логический адрес владельца")
  })

  it("keeps local reference entries together with owner records", () => {
    const fact = sampleOwnerFacts()[0]
    if (fact === undefined) throw new Error("Ожидались факты владельца")
    const target = objectTarget("Справочник.Товары")

    const snapshot = createImportSharedValidationSnapshot({
      objectRecords: [
        {
          filePath: fact.filePath,
          projectPath: fact.filePath,
          kind: "properties",
          owner: { dir: fact.ref.kind, name: fact.ref.name ?? "" },
          ownerRef: fact.ref,
          ownerFacts: fact,
          fieldIndex: fact.fieldIndex,
          importDiagnostics: [],
        },
      ],
      objectIndexEntries: [
        {
          canonical: projectObjectIndexKey(target),
          target,
          result: { ok: true, filePath: fact.filePath },
        },
      ],
      memberIndexEntries: [],
      valueIndexEntries: [],
      pendingReferences: [],
    })

    expect(snapshot.reference.stats.objectEntries).toBe(1)
    expect(snapshot.owners.records).toBe(1)
  })
})

function objectTarget(value: string) {
  const parsed = parseMetadataTargetFromYAML({ value, constraint: { kind: "object" } })
  if (!parsed.ok || parsed.target.kind !== "object") throw new Error(value)
  return parsed.target
}

function sampleOwnerFacts(): ValidationOwnerFacts[] {
  return [
    {
      ref: { kind: "Справочник", name: "Товары" },
      filePath: "Справочник/Товары/Свойства.yaml",
      fieldIndex: {
        fields: new Map(),
        standardAttributeAliases: new Map([["Code", "Код"]]),
        diagnostics: [],
      },
    },
  ]
}
