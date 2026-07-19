import { describe, expect, it } from "vitest"
import type { ValidationOwnerFacts } from "../validation/dataPath/ownerFacts"
import { createImportSharedMetadata } from "./metadataSnapshot"

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
})

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
