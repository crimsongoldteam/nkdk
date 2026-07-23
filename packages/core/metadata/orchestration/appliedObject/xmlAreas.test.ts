import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { beforeEach, describe, expect, it } from "vitest"
import { MetadataCatalogRules } from "../../appliedObjects/metadataCatalog/rules"
import { registerCoreMetadata } from "../../register"
import { resolveXmlSyncAreaForProjectPath } from "./xmlAreas"

describe("resolveXmlSyncAreaForProjectPath", () => {
  beforeEach(() => {
    registerCoreMetadata()
  })

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
      resolveXmlSyncAreaForProjectPath("Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", [MetadataCatalogRules])
    ).toMatchObject({
      kind: "fileItem",
      itemType: "MetadataCatalog",
      itemTypePrefix: "Справочник",
      itemName: "Товары",
      xmlDir: "Catalogs",
      propertyName: "forms",
      propertyType: "ChildFormNames",
      routeParams: { itemName: "ФормаЭлемента" },
      xmlPath: "Catalogs/Товары/Forms/ФормаЭлемента.xml",
    })
  })

  it("maps form module to form module area", () => {
    expect(
      resolveXmlSyncAreaForProjectPath("Справочник/Товары/Формы/ФормаЭлемента/Модуль.bsl", [MetadataCatalogRules])
    ).toMatchObject({
      kind: "externalFile",
      itemName: "Товары",
      propertyName: "forms",
      propertyType: "ChildFormNames",
      routeParams: { itemName: "ФормаЭлемента" },
      xmlPath: "Catalogs/Товары/Forms/ФормаЭлемента/Ext/Form/Module.bsl",
      dumpInfoNames: ["Catalog.Товары.Form.ФормаЭлемента", "Catalog.Товары.Form.ФормаЭлемента.Form"],
    })
  })

  it("returns undefined for unknown project path", () => {
    expect(resolveXmlSyncAreaForProjectPath("Неизвестно/file.txt", [MetadataCatalogRules])).toBeUndefined()
  })

  it("maps object module through declarative rule", () => {
    expect(
      resolveXmlSyncAreaForProjectPath("Справочник/Товары/МодульОбъекта.bsl", [MetadataCatalogRules])
    ).toMatchObject({
      kind: "externalFile",
      xmlPath: "Catalogs/Товары/Ext/ObjectModule.bsl",
      dumpInfoNames: ["Catalog.Товары", "Catalog.Товары.ObjectModule"],
    })
  })

  it("does not contain private orchestration knowledge", () => {
    const source = readFileSync(fileURLToPath(import.meta.url).replace(/\.test\.ts$/, ".ts"), "utf-8")
    expect(source).not.toContain('parts[2] === "Формы"')
    expect(source).not.toContain('parts[2] === "Макеты"')
    expect(source).not.toContain('rule.itemType === "MetadataCatalog"')
    expect(source).not.toContain('rule.type === "ChildFormNames"')
    expect(source).not.toContain('rule.type === "ChildTemplateNames"')
  })

  it("appliedObject sync uses fileChildNamesDescriptor instead of child form/template strings", () => {
    const syncToXmlSource = readFileSync(fileURLToPath(new URL("./syncToXML.ts", import.meta.url)), "utf-8")

    expect(syncToXmlSource).toContain("fileChildNamesDescriptor")
    expect(syncToXmlSource).not.toContain('rule.type === "ChildFormNames"')
    expect(syncToXmlSource).not.toContain('rule.type === "ChildTemplateNames"')
  })
})
