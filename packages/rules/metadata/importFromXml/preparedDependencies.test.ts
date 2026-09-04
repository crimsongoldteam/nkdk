import { describe, expect, it } from "vitest"
import "../../tests/metadataExecutionContext"
import { MetadataCatalogRules } from "../appliedObjects/metadataCatalog/rules"
import { FormAttributeRules } from "../forms/commonObjects/formAttribute/rules"
import { StandardAttributeDescriptionRules } from "../commonObjects/standardAttributeDescription/rules"
import { MetadataWebServiceRules } from "../appliedObjects/metadataWebService/rules"
import { collectImportDependencyFacts, prepareImportDependencies } from "./preparedDependencies"
import type { ImportedDependentPropertyCandidate, MetadataItemRule } from "@nkdk/runtime/rule-kit"

const owner = { dir: "Справочник", name: "Товары" }

describe("prepared import dependencies", () => {
  it("готовит факты отсутствующего зависимого свойства по исходному адресу item", () => {
    const facts = collectImportDependencyFacts({
      rule: MetadataCatalogRules, owner, candidates: [],
      yaml: { Атрибуты: { Список: { Тип: "СписокЗначений", Колонки: { НеНужна: { Тип: "Строка" } } } } },
      propertyFacts: [{
        itemType: "FormAttribute", itemRule: FormAttributeRules, propertyKey: "type", value: "СписокЗначений",
        yamlPath: ["Атрибуты", "Список", "Тип"], sourceYamlPath: ["Атрибуты", 0, "Тип"],
      }, {
        itemType: "FormAttribute", itemRule: FormAttributeRules, propertyKey: "valueType", value: undefined,
        yamlPath: ["Атрибуты", "Список", "ТипЗначения"], sourceYamlPath: ["Атрибуты", 0, "ТипЗначения"],
      }],
      finalRootYaml: { Атрибуты: { Список: { Тип: "СписокЗначений" } } },
    })
    const dependencies = prepareImportDependencies(facts)
    const prepared = dependencies.itemFacts?.(["Атрибуты", 0], "FormAttribute")
    expect(prepared).toEqual({ item: { Тип: "СписокЗначений" }, root: {} })
    expect(dependencies.itemFacts?.(["Атрибуты", "Список"], "FormAttribute")).toBe(prepared)
    expect(dependencies.itemFacts?.(["Атрибуты", 0], "MetadataAttribute")).toBeUndefined()
    expect(dependencies.propertyValue?.(["Атрибуты", 0], "valueType"))
      .toEqual({ present: false, value: undefined })
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

  it("использует окончательное имя элемента коллекции для зависимого свойства", () => {
    const candidate: ImportedDependentPropertyCandidate = {
      itemType: "StandardAttributeDescription", itemName: "Owner", itemYamlPath: ["СтандартныеРеквизиты", 0],
      propertyKey: "fillValue", yamlPath: ["СтандартныеРеквизиты", 0, "ЗначениеЗаполнения"],
      presentInXML: true, xmlValue: { "_xsi:type": "xr:DesignTimeRef", "#text": "Catalog.Владельцы.EmptyRef" },
    }
    const facts = collectImportDependencyFacts({
      rule: MetadataCatalogRules, owner, candidates: [candidate],
      yaml: {
        Владельцы: ["Справочник.Владельцы"],
        СтандартныеРеквизиты: [{ ЗначениеЗаполнения: "Справочник.Владельцы.ПустаяСсылка" }],
      },
      propertyFacts: [{
        itemType: "StandardAttributeDescription", itemRule: StandardAttributeDescriptionRules,
        propertyKey: "fillValue", value: "Справочник.Владельцы.ПустаяСсылка",
        yamlPath: ["СтандартныеРеквизиты", "Владелец", "ЗначениеЗаполнения"],
        sourceYamlPath: ["СтандартныеРеквизиты", 0, "ЗначениеЗаполнения"],
      }],
    })

    expect(prepareImportDependencies(facts).shouldOmit(candidate, {
      ЗначениеЗаполнения: "Справочник.Владельцы.ПустаяСсылка",
    })).toBe(true)
  })

  it("сохраняет компактное xmlOnly-значение для локального экспорта", () => {
    const facts = collectImportDependencyFacts({
      rule: MetadataCatalogRules, owner, candidates: [], yaml: {},
      propertyFacts: [{
        itemType: MetadataCatalogRules.itemType,
        itemRule: MetadataCatalogRules,
        propertyKey: "forms",
        value: ["ФормаСписка", "ФормаЭлемента"],
        yamlPath: ["Формы"],
      }],
    })

    expect(prepareImportDependencies(facts).propertyValue?.([], "forms"))
      .toEqual({ value: ["ФормаСписка", "ФормаЭлемента"] })
  })

  it("сохраняет компактное неявное значение для локального экспорта", () => {
    const facts = catalogCodeLengthFacts()

    expect(prepareImportDependencies(facts).propertyValue?.([], "codeLength"))
      .toEqual({ value: 9 })
  })

  it("восстанавливает исходное XML-значение опущенного default", () => {
    const facts = catalogCodeLengthFacts({ ДлинаКода: null })

    expect(prepareImportDependencies(facts).propertyValue?.([], "codeLength"))
      .toEqual({ value: 9 })
  })

  it("сохраняет пустой XML-контейнер для локального proof", () => {
    const facts = collectImportDependencyFacts({
      rule: MetadataWebServiceRules,
      owner,
      candidates: [],
      yaml: {},
      proofPropertyFacts: [{
        itemType: MetadataWebServiceRules.itemType,
        itemRule: MetadataWebServiceRules,
        propertyKey: "operations",
        value: undefined,
        reconstructionValue: {},
        yamlPath: ["Операции"],
      }],
    })

    expect(prepareImportDependencies(facts).propertyValue?.([], "operations"))
      .toEqual({ value: {} })
  })

  it("не подавляет присутствующий пустой XML nested-свойства, опущенный из YAML", () => {
    const nestedRule = {
      itemType: "Nested",
      properties: {
        settings: {
          type: "string",
          yaml: "Настройки",
          preserveEmptyXML: true,
        },
      },
    } as const satisfies MetadataItemRule
    const facts = collectImportDependencyFacts({
      rule: MetadataCatalogRules,
      owner,
      candidates: [],
      yaml: { Элементы: { Первый: {} } },
      finalRootYaml: { Элементы: { Первый: {} } },
      proofPropertyFacts: [{
        itemType: nestedRule.itemType,
        itemRule: nestedRule,
        propertyKey: "settings",
        value: undefined,
        reconstructionValue: {},
        presentInXML: true,
        yamlPath: ["Элементы", "Первый", "Настройки"],
      }],
    })

    expect(prepareImportDependencies(facts).propertyValue?.(["Элементы", "Первый"], "settings"))
      .toEqual({ value: {} })
  })

})

function catalogCodeLengthFacts(finalRootYaml?: Readonly<Record<string, unknown>>) {
  return collectImportDependencyFacts({
    rule: MetadataCatalogRules,
    owner,
    candidates: [],
    yaml: {},
    ...(finalRootYaml === undefined ? {} : { finalRootYaml }),
    propertyFacts: [{
      itemType: MetadataCatalogRules.itemType,
      itemRule: MetadataCatalogRules,
      propertyKey: "codeLength",
      value: 9,
      reconstructionValue: 9,
      yamlPath: ["ДлинаКода"],
    }],
  })
}
