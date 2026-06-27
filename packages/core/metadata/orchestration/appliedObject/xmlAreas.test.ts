import { describe, expect, it } from "vitest"
import { MetadataCatalogRules } from "~/metadata/appliedObjects/metadataCatalog/rules"
import { resolveXmlSyncAreaForProjectPath } from "./xmlAreas"

describe("resolveXmlSyncAreaForProjectPath", () => {
  it("maps owner properties yaml to owner xml area", () => {
    expect(resolveXmlSyncAreaForProjectPath("Справочник/Товары/Свойства.yaml", [MetadataCatalogRules])).toEqual({
      kind: "owner",
      itemType: "MetadataCatalog",
      itemTypePrefix: "Справочник",
      itemName: "Товары",
      xmlDir: "Catalogs",
    })
  })

  it("maps form yaml to form xml area", () => {
    expect(
      resolveXmlSyncAreaForProjectPath("Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", [MetadataCatalogRules]),
    ).toEqual({
      kind: "fileItem",
      itemType: "MetadataCatalog",
      itemTypePrefix: "Справочник",
      itemName: "Товары",
      childKind: "form",
      childName: "ФормаЭлемента",
      xmlDir: "Catalogs",
      xmlBasePath: "Catalogs/Товары/Forms/ФормаЭлемента",
      ownerCompositionChanges: false,
    })
  })

  it("maps form module to form module area", () => {
    expect(
      resolveXmlSyncAreaForProjectPath("Справочник/Товары/Формы/ФормаЭлемента/Модуль.bsl", [MetadataCatalogRules]),
    ).toMatchObject({
      kind: "externalFile",
      itemName: "Товары",
      childName: "ФормаЭлемента",
      xmlPath: "Catalogs/Товары/Forms/ФормаЭлемента/Ext/Form/Module.bsl",
      dumpInfoNames: ["Catalog.Товары.Form.ФормаЭлемента", "Catalog.Товары.Form.ФормаЭлемента.Form"],
    })
  })

  it("returns undefined for unknown project path", () => {
    expect(resolveXmlSyncAreaForProjectPath("Неизвестно/file.txt", [MetadataCatalogRules])).toBeUndefined()
  })
})
