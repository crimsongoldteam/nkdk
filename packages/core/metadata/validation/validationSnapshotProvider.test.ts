import { describe, expect, it } from "vitest"
import type { ParsedMetadataTarget } from "../commonObjects/metadataTargets"
import { createOwnerMetadataCacheFromValidationTable } from "./dataPath/ownerCache"
import { projectObjectIndexKey } from "./projectReferenceIndex"
import { createValidationObjectTable } from "./projectValidationObjectTable"
import type { ValidationObjectRecord } from "./projectValidationTypes"
import { getValidationProjectSpecByDir } from "./projectSpecs"
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
    expect(sharedOwner.owner.model).toEqual(regularOwner.owner.model)
    expect([...sharedOwner.owner.fieldIndex.fields.entries()]).toEqual([...regularOwner.owner.fieldIndex.fields.entries()])
  })

  it("creates a partial reference index that can request a dependency", () => {
    const target: Extract<ParsedMetadataTarget, { kind: "object" }> = {
      kind: "object",
      root: "Catalog",
      objectName: "Товары",
    }
    const table = createValidationObjectTable({
      records: [],
      filePaths: [],
    })
    table.mergeReferenceIndexEntries({
      objectIndexEntries: [],
      memberIndexEntries: [],
      valueIndexEntries: [],
      pendingReferences: [],
    })
    const provider = createValidationSnapshotProvider(table.snapshot())
    const catalogSpec = getValidationProjectSpecByDir("Справочник")
    if (catalogSpec === undefined) throw new Error("catalog spec expected")
    const index = provider.referenceIndex({
      projectDir: "/project",
      mode: "partial",
      resolveObjectFilePath: () => "/project/Справочник/Товары/Свойства.yaml",
      resolveProjectFile: () => ({
        kind: "needsDependency",
        file: {
          absolutePath: "/project/Справочник/Товары/Свойства.yaml",
          projectPath: "Справочник/Товары/Свойства.yaml",
          kind: "properties",
          owner: { dir: "Справочник", name: "Товары", spec: catalogSpec },
        },
        requestedBy: "/project/Справочник/Товары/Свойства.yaml",
      }),
    })

    const result = index.resolve({
      filePath: "/project/Документ/Заказ/Свойства.yaml",
      yamlPath: ["Реквизиты", 0, "Тип"],
      canonical: projectObjectIndexKey(target),
      target,
      constraint: { kind: "object" },
    })

    expect(result).toMatchObject({ ok: false, reason: "needsDependency" })
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
