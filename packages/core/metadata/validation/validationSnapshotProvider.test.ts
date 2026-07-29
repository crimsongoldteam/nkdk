import { describe, expect, it } from "vitest"
import { createOwnerMetadataCacheFromValidationTable } from "./dataPath/ownerCache"
import { createValidationObjectTable } from "./projectValidationObjectTable"
import type { ValidationObjectRecord } from "./projectValidationTypes"
import { createValidationSnapshotProvider } from "./validationSnapshotProvider"

describe("ValidationSnapshotProvider", () => {
  it("creates owner cache from the shared binary snapshot", () => {
    const table = createValidationObjectTable({
      records: [catalogRecord()],
      filePaths: ["/project/Справочник/Номенклатура/Свойства.yaml"],
    })
    const provider = createValidationSnapshotProvider(table.snapshot())
    const regular = createOwnerMetadataCacheFromValidationTable({ projectDir: "/project", table })
    const shared = provider.ownerCache("/project")

    const regularOwner = regular.get({ kind: "Справочник", name: "Номенклатура" })
    const sharedOwner = shared.get({ kind: "Справочник", name: "Номенклатура" })

    expect(provider.sharedPayload().owners.format).toBe("binary")
    expect(sharedOwner).toMatchObject({ status: regularOwner.status })
    if (sharedOwner.status !== "ok" || regularOwner.status !== "ok") throw new Error("owner expected")
    expect(sharedOwner.owner.facts).toEqual(regularOwner.owner.facts)
    expect([...sharedOwner.owner.fieldIndex.fields.entries()]).toEqual([...regularOwner.owner.fieldIndex.fields.entries()])
  })
})

function catalogRecord(): ValidationObjectRecord {
  return {
    filePath: "/project/Справочник/Номенклатура/Свойства.yaml",
    projectPath: "Справочник/Номенклатура/Свойства.yaml",
    kind: "properties",
    owner: { dir: "Справочник", name: "Номенклатура" },
    ownerRef: { kind: "Справочник", name: "Номенклатура" },
    fieldIndex: {
      fields: new Map([
        [
          "Артикул",
          {
            name: "Артикул",
            kind: "attribute",
            sourceCollection: "attributes",
            typeInfo: { kinds: ["scalar"] as const, nextTypes: [], sourceText: "String" },
          },
        ],
      ]),
      standardAttributeAliases: new Map([["Code", "Код"]]),
      diagnostics: [],
    },
    importDiagnostics: [],
  }
}
