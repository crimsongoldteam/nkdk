import { describe, expect, it } from "vitest"
import { createValidationOwnerFacts, modelStubFromOwnerFacts } from "./ownerFacts"

describe("ValidationOwnerFacts", () => {
  it("keeps document register records in model stubs", () => {
    const facts = createValidationOwnerFacts({
      ref: { kind: "Документ", name: "Операция" },
      filePath: "/project/Документ/Операция/Свойства.yaml",
      fieldIndex: { fields: new Map(), standardAttributeAliases: new Map(), diagnostics: [] },
      model: {
        itemType: "MetadataDocument",
        name: "Операция",
        registerRecords: ["AccountingRegister.Хозрасчетный"],
      },
    })

    expect(modelStubFromOwnerFacts(facts)).toMatchObject({
      registerRecords: ["AccountingRegister.Хозрасчетный"],
    })
  })
})
