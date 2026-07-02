import { describe, expect, it } from "vitest"
import { createValidationObjectTable } from "./projectValidationObjectTable"
import { createOwnerMetadataCacheFromValidationTable } from "./dataPath/ownerCache"
import { createOwnerMetadataCacheFromSharedValidationSnapshot } from "./dataPath/sharedOwnerCache"
import { createSharedValidationSnapshot } from "./sharedValidationSnapshot"
import type { ValidationObjectRecord } from "./projectValidationTypes"

describe("SharedValidationSnapshot", () => {
  it("restores owner field indexes for shared owner cache", () => {
    const table = createValidationObjectTable({
      records: [catalogRecord()],
      filePaths: ["/project/Справочник/Номенклатура/Свойства.yaml"],
    })
    const shared = createSharedValidationSnapshot(table.snapshot())
    const regular = createOwnerMetadataCacheFromValidationTable({ projectDir: "/project", table })
    const sharedCache = createOwnerMetadataCacheFromSharedValidationSnapshot({ projectDir: "/project", snapshot: shared })

    const regularOwner = regular.get({ kind: "Справочник", name: "Номенклатура" })
    const sharedOwner = sharedCache.get({ kind: "Справочник", name: "Номенклатура" })

    expect(shared.owners.bytes).toBeGreaterThan(0)
    expect(sharedOwner.status).toBe("ok")
    expect(sharedOwner).toMatchObject({ status: regularOwner.status })
    if (sharedOwner.status !== "ok" || regularOwner.status !== "ok") throw new Error("owner expected")
    expect([...sharedOwner.owner.fieldIndex.fields.entries()]).toEqual([...regularOwner.owner.fieldIndex.fields.entries()])
    expect([...sharedOwner.owner.fieldIndex.standardAttributeAliases.entries()]).toEqual(
      [...regularOwner.owner.fieldIndex.standardAttributeAliases.entries()]
    )
  })

  it("uses binary owner snapshot when NKDK_VALIDATION_SHARED_OWNER_FORMAT=binary", () => {
    const previous = process.env["NKDK_VALIDATION_SHARED_OWNER_FORMAT"]
    process.env["NKDK_VALIDATION_SHARED_OWNER_FORMAT"] = "binary"
    try {
      const table = createValidationObjectTable({
        records: [catalogRecord()],
        filePaths: ["/project/Справочник/Номенклатура/Свойства.yaml"],
      })
      const shared = createSharedValidationSnapshot(table.snapshot())

      expect(shared.owners.format).toBe("binary")
      expect(shared.owners.bytes).toBeGreaterThan(0)
    } finally {
      if (previous === undefined) delete process.env["NKDK_VALIDATION_SHARED_OWNER_FORMAT"]
      else process.env["NKDK_VALIDATION_SHARED_OWNER_FORMAT"] = previous
    }
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
            typeInfo: { kinds: ["string"], nextTypes: [], sourceText: "String" },
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
                    typeInfo: { kinds: ["decimal"], nextTypes: [], sourceText: "Number" },
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
