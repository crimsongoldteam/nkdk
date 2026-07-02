import { describe, expect, it } from "vitest"
import { createOwnerMetadataCacheFromValidationTable } from "./dataPath/ownerCache"
import { createValidationObjectTable } from "./projectValidationObjectTable"
import type { ValidationObjectRecord } from "./projectValidationTypes"
import { createBinarySharedOwnersSnapshot, createOwnerMetadataCacheFromBinarySharedOwners } from "./sharedValidationBinaryOwners"

describe("SharedValidationBinaryOwners", () => {
  it("restores owner field indexes without JSON decoding", () => {
    const table = createValidationObjectTable({
      records: [catalogRecord()],
      filePaths: ["/project/Справочник/Номенклатура/Свойства.yaml"],
    })
    const snapshot = createBinarySharedOwnersSnapshot(table.snapshot())
    const regular = createOwnerMetadataCacheFromValidationTable({ projectDir: "/project", table })
    const binary = createOwnerMetadataCacheFromBinarySharedOwners({ projectDir: "/project", snapshot })

    const regularOwner = regular.get({ kind: "Справочник", name: "Номенклатура" })
    const binaryOwner = binary.get({ kind: "Справочник", name: "Номенклатура" })

    expect(snapshot.bytes).toBeGreaterThan(0)
    expect(binaryOwner.status).toBe("ok")
    expect(binaryOwner).toMatchObject({ status: regularOwner.status })
    if (binaryOwner.status !== "ok" || regularOwner.status !== "ok") throw new Error("owner expected")
    expect([...binaryOwner.owner.fieldIndex.fields.entries()]).toEqual([...regularOwner.owner.fieldIndex.fields.entries()])
    expect([...binaryOwner.owner.fieldIndex.standardAttributeAliases.entries()]).toEqual(
      [...regularOwner.owner.fieldIndex.standardAttributeAliases.entries()]
    )
  })

  it("returns not-found diagnostics for missing owners", () => {
    const table = createValidationObjectTable({ records: [], filePaths: [] })
    const snapshot = createBinarySharedOwnersSnapshot(table.snapshot())
    const binary = createOwnerMetadataCacheFromBinarySharedOwners({ projectDir: "/project", snapshot })

    expect(binary.get({ kind: "Справочник", name: "НетТакого" })).toMatchObject({ status: "not-found" })
  })
})

function catalogRecord(): ValidationObjectRecord {
  return {
    filePath: "/project/Справочник/Номенклатура/Свойства.yaml",
    projectPath: "Справочник/Номенклатура/Свойства.yaml",
    kind: "properties",
    owner: { dir: "Справочник", name: "Номенклатура" },
    ownerRef: { kind: "Справочник", name: "Номенклатура" },
    model: { itemType: "MetadataCatalog", name: "Номенклатура" },
    fieldIndex: {
      fields: new Map([
        [
          "Артикул",
          {
            name: "Артикул",
            kind: "attribute",
            sourceCollection: "attributes",
            typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText: "String" },
          },
        ],
        [
          "Товары",
          {
            name: "Товары",
            kind: "tabularSection",
            sourceCollection: "tabularSections",
            typeInfo: {
              kinds: ["tableSource"],
              nextTypes: [],
              table: { kind: "TabularSection", owner: { kind: "Справочник", name: "Номенклатура" }, name: "Товары" },
            },
            tableSource: {
              table: { kind: "TabularSection", owner: { kind: "Справочник", name: "Номенклатура" }, name: "Товары" },
              columns: new Map([
                [
                  "Количество",
                  {
                    name: "Количество",
                    kind: "attribute",
                    sourceCollection: "attributes",
                    typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText: "Number" },
                  },
                ],
              ]),
              hasColumns: true,
            },
          },
        ],
      ]),
      standardAttributeAliases: new Map([["Code", "Код"]]),
      diagnostics: [],
    },
    importDiagnostics: [],
  }
}
