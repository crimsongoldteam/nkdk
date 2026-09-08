import { expect, it } from "vitest"
import { MetadataCatalogRules } from "../appliedObjects/metadataCatalog/rules"
import { collectImportUniqueNameIssues } from "./uniqueNameScopes"

it("находит конфликт имён между коллекциями по фактам, без YAML", () => {
  expect(collectImportUniqueNameIssues(MetadataCatalogRules, [
    { kind: "item", itemType: "MetadataCatalogAttribute", name: "ОбщееИмя", yamlPath: ["Реквизиты", "ОбщееИмя"], rulePath: [] },
    { kind: "item", itemType: "MetadataCatalogTabularSection", name: "ОбщееИмя", yamlPath: ["ТабличныеЧасти", "ОбщееИмя"], rulePath: [] },
  ])).toEqual([expect.objectContaining({
    code: "diagnostic.structure",
    target: { kind: "path", path: ["ТабличныеЧасти", "ОбщееИмя"] },
    params: { message: 'Имя "ОбщееИмя" должно быть уникальным в коллекциях Реквизиты, ТабличныеЧасти' },
  })])
})

it("не смешивает имена вложенных реквизитов и корневых коллекций", () => {
  expect(collectImportUniqueNameIssues(MetadataCatalogRules, [
    { kind: "item", itemType: "MetadataCatalogAttribute", name: "ОбщееИмя", yamlPath: ["Реквизиты", "ОбщееИмя"], rulePath: [] },
    { kind: "item", itemType: "MetadataCatalogAttribute", name: "ОбщееИмя", yamlPath: ["ТабличныеЧасти", "Строки", "Реквизиты", "ОбщееИмя"], rulePath: [] },
  ])).toEqual([])
})
