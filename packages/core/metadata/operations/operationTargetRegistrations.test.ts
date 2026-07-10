import { describe, expect, it } from "vitest"
import { MetadataCatalogRules } from "../appliedObjects/metadataCatalog/rules"
import { MetadataDocumentRules } from "../appliedObjects/metadataDocument/rules"
import { MetadataInformationRegisterRules } from "../appliedObjects/metadataInformationRegister/rules"
import type { PropertyRule } from "../orchestration/property/types"

describe("operation target registrations", () => {
  it("declares catalog attributes, tabular sections and file items", () => {
    expect(rule(MetadataCatalogRules.properties.attributes).operationTarget).toMatchObject({
      kind: "namedCollectionTarget",
      targetKind: "attribute",
      migrationSegment: "Реквизит",
      requiresMigration: true,
    })
    expect(rule(MetadataCatalogRules.properties.tabularSections).operationTarget).toMatchObject({
      kind: "namedCollectionTarget",
      targetKind: "tabularSection",
      migrationSegment: "ТабличнаяЧасть",
      requiresMigration: true,
    })
    expect(rule(MetadataCatalogRules.properties.forms).operationTarget).toMatchObject({
      kind: "fileItemCollectionTarget",
      role: "form",
      folderName: "Формы",
      requiresMigration: false,
    })
  })

  it("declares document and register child identity collections", () => {
    expect(rule(MetadataDocumentRules.properties.attributes).operationTarget?.requiresMigration).toBe(true)
    expect(rule(MetadataDocumentRules.properties.tabularSections).operationTarget?.requiresMigration).toBe(true)
    expect(rule(MetadataInformationRegisterRules.properties.dimensions).operationTarget).toMatchObject({
      targetKind: "dimension",
      migrationSegment: "Измерение",
    })
    expect(rule(MetadataInformationRegisterRules.properties.resources).operationTarget).toMatchObject({
      targetKind: "resource",
      migrationSegment: "Ресурс",
    })
  })
})

function rule(value: PropertyRule): PropertyRule {
  return value
}
