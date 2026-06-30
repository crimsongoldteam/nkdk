import { describe, expect, it } from "vitest"
import { MetadataCatalogRules } from "~/metadata/appliedObjects/metadataCatalog/rules"
import { MetadataDocumentRules } from "~/metadata/appliedObjects/metadataDocument/rules"
import { MetadataInformationRegisterRules } from "~/metadata/appliedObjects/metadataInformationRegister/rules"

describe("operation target registrations", () => {
  it("declares catalog attributes, tabular sections and file items", () => {
    expect(MetadataCatalogRules.properties.attributes.operationTarget).toMatchObject({
      kind: "namedCollectionTarget",
      targetKind: "attribute",
      migrationSegment: "Реквизит",
      requiresMigration: true,
    })
    expect(MetadataCatalogRules.properties.tabularSections.operationTarget).toMatchObject({
      kind: "namedCollectionTarget",
      targetKind: "tabularSection",
      migrationSegment: "ТабличнаяЧасть",
      requiresMigration: true,
    })
    expect(MetadataCatalogRules.properties.forms.operationTarget).toMatchObject({
      kind: "fileItemCollectionTarget",
      role: "form",
      folderName: "Формы",
      requiresMigration: false,
    })
  })

  it("declares document and register child identity collections", () => {
    expect(MetadataDocumentRules.properties.attributes.operationTarget?.requiresMigration).toBe(true)
    expect(MetadataDocumentRules.properties.tabularSections.operationTarget?.requiresMigration).toBe(true)
    expect(MetadataInformationRegisterRules.properties.dimensions.operationTarget).toMatchObject({
      targetKind: "dimension",
      migrationSegment: "Измерение",
    })
    expect(MetadataInformationRegisterRules.properties.resources.operationTarget).toMatchObject({
      targetKind: "resource",
      migrationSegment: "Ресурс",
    })
  })
})
