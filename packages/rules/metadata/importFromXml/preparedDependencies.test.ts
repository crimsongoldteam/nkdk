import { describe, expect, it } from "vitest"
import "../../tests/metadataExecutionContext"
import { MetadataCatalogRules } from "../appliedObjects/metadataCatalog/rules"
import { FormAttributeRules } from "../forms/commonObjects/formAttribute/rules"
import { collectImportDependencyFacts, prepareImportDependencies } from "./preparedDependencies"
import type { ImportedDependentPropertyCandidate } from "@nkdk/runtime/rule-kit"

const owner = { dir: "Справочник", name: "Товары" }

describe("prepared import dependencies", () => {
  it("готовит факты отсутствующего зависимого свойства по исходному адресу item", () => {
    const facts = collectImportDependencyFacts({
      rule: MetadataCatalogRules, owner, candidates: [],
      yaml: { Атрибуты: { Список: { Тип: "СписокЗначений", Колонки: { НеНужна: { Тип: "Строка" } } } } },
      propertyFacts: [{
        itemType: "FormAttribute", itemRule: FormAttributeRules, propertyKey: "type", value: "СписокЗначений",
        yamlPath: ["Атрибуты", "Список", "Тип"], sourceYamlPath: ["Атрибуты", 0, "Тип"],
      }],
    })
    const dependencies = prepareImportDependencies(facts)
    const prepared = dependencies.itemFacts?.(["Атрибуты", 0], "FormAttribute")
    expect(prepared).toEqual({ item: { Тип: "СписокЗначений" }, root: {} })
    expect(dependencies.itemFacts?.(["Атрибуты", "Список"], "FormAttribute")).toBe(prepared)
    expect(dependencies.itemFacts?.(["Атрибуты", 0], "MetadataAttribute")).toBeUndefined()
    expect(facts.properties.size).toBe(0)
  })

  it.each([
    [["СтандартныйРеквизит.Наименование", "СтандартныйРеквизит.Код"], true],
    [["СтандартныйРеквизит.Код", "СтандартныйРеквизит.Наименование"], false],
    [["СтандартныйРеквизит.Код"], false],
  ] as const)("определяет неявный ВводПоСтроке до завершения item: %j", (value, omitted) => {
    const candidate: ImportedDependentPropertyCandidate = {
      itemType: "MetadataCatalog", itemYamlPath: [], propertyKey: "inputByString",
      yamlPath: ["ВводПоСтроке"], presentInXML: true, xmlValue: undefined,
    }
    const facts = collectImportDependencyFacts({
      rule: MetadataCatalogRules, owner, candidates: [candidate],
      yaml: { ДлинаКода: 3, ДлинаНаименования: 20, Реквизиты: { НеНужен: { Тип: "Строка" } } },
    })
    expect(prepareImportDependencies(facts).shouldOmit(candidate, { ВводПоСтроке: value })).toBe(omitted)
    expect([...facts.properties.values()]).toEqual([
      { item: {}, root: { ДлинаКода: 3, ДлинаНаименования: 20 } },
    ])
  })

  it("удерживает только тип реквизита, не XML, значение или соседние объекты", () => {
    const candidate: ImportedDependentPropertyCandidate = {
      itemType: "MetadataAttribute", itemName: "Получатель", itemYamlPath: ["Реквизиты", "Получатель"],
      propertyKey: "fillValue", yamlPath: ["Реквизиты", "Получатель", "ЗначениеЗаполнения"],
      presentInXML: true, xmlValue: { "_xsi:type": "xs:string", "#text": "старое" },
    }
    const facts = collectImportDependencyFacts({
      rule: MetadataCatalogRules, owner, candidates: [candidate],
      yaml: { Реквизиты: { Получатель: { Тип: "Строка(10)", Заголовок: "Получатель", ЗначениеЗаполнения: "старое" } } },
    })
    expect([...facts.properties.values()]).toEqual([{ item: { Тип: "Строка(10)" }, root: {} }])
    const dependencies = prepareImportDependencies(facts)
    expect(dependencies.shouldOmit(candidate, { ЗначениеЗаполнения: "" })).toBe(true)
    expect(dependencies.shouldOmit(candidate, { ЗначениеЗаполнения: "новое" })).toBe(false)
  })
})
