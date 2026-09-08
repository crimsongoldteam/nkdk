import { describe, expect, it, vi } from "vitest"
import "../../tests/metadataExecutionContext"
import { MetadataCatalogRules } from "../appliedObjects/metadataCatalog/rules"
import { FormAttributeRules } from "../forms/commonObjects/formAttribute/rules"
import { StandardAttributeDescriptionRules } from "../commonObjects/standardAttributeDescription/rules"
import { MetadataWebServiceRules } from "../appliedObjects/metadataWebService/rules"
import { RecalculationRules } from "../appliedObjects/metadataCalculationRegister/recalculation/rules"
import { MetadataCalculationRegisterRecalculationDimensionRules } from "../appliedObjects/metadataCalculationRegister/recalculation/dimension/rules"
import { collectImportDependencyFacts, prepareImportDependencies } from "./preparedDependencies"
import type { ImportedDependentPropertyCandidate, MetadataItemRule } from "@nkdk/runtime/rule-kit"
import type { DirectImportPropertyFact } from "./propertyFacts"
import { dependentImportDependencies, selectDependentImportFacts } from "@nkdk/runtime/rule-kit"

const owner = { dir: "Справочник", name: "Товары" }
const typedItemRule: MetadataItemRule = {
  itemType: "TypedItem",
  properties: {
    type: { type: "string", yaml: "Тип" },
    form: { type: "string", yaml: "Форма", metadataTarget: {
      kind: "member", owner: "type", typeProperty: "type", memberKinds: ["Form"],
    } },
  },
}

describe("prepared import dependencies", () => {
  it("разделяет компактный набор связей между измерениями без удержания комментариев", () => {
    const rule = MetadataCalculationRegisterRecalculationDimensionRules
    const facts = collectImportDependencyFacts({
      rule: RecalculationRules, owner, yaml: undefined, candidates: [],
      propertyFacts: ["Первое", "Второе"].flatMap(name => [
        { itemType: rule.itemType, itemRule: rule, propertyKey: "leadingRegisterData",
          yamlPath: ["Измерения", name, "ДанныеВедущихРегистров"], value: ["Измерение"] },
        { itemType: rule.itemType, itemRule: rule, propertyKey: "comment",
          yamlPath: ["Измерения", name, "Комментарий"], value: "Не нужен во втором проходе" },
      ]),
    })
    const first = facts.items.get(["Измерения", "Первое"], rule.itemType)!
    const second = facts.items.get(["Измерения", "Второе"], rule.itemType)!
    expect(first.root).toEqual({ Измерения: {
      Первое: { ДанныеВедущихРегистров: ["Измерение"] }, Второе: { ДанныеВедущихРегистров: ["Измерение"] },
    } })
    expect(first.root).toBe(second.root)
  })
  it("оставляет в зависимости коллекции только объявленные поля и имена", () => {
    const dependencies = { item: [], root: [{ collection: "Измерения", properties: ["Связи"] }] } as const
    const rootYaml = { Измерения: { Первое: { Связи: ["Ссылка"], get Комментарий() { throw new Error("Лишнее поле") } }, Второе: {} } }
    const first = selectDependentImportFacts(dependencies, { item: {}, rootYaml })
    expect(first.root).toEqual({ Измерения: { Первое: { Связи: ["Ссылка"] }, Второе: {} } })
  })
  it("различает отсутствующее выбранное поле и неотобранное независимое поле", () => {
    const rule = { itemType: "SelectedRoot", properties: {
      attributes: { type: "string", yaml: "Реквизиты" },
      synonym: { type: "string", yaml: "Синоним" },
    } } as const satisfies MetadataItemRule
    const facts = collectImportDependencyFacts({
      rule, owner, yaml: undefined, candidates: [], propertyFacts: [], finalPropertyFacts: [],
      selectedRootProperties: new Set(["Реквизиты"]),
    })
    const dependencies = prepareImportDependencies(facts)
    expect(dependencies.propertyValue?.([], "attributes")).toEqual({ present: false, value: undefined })
    expect(dependencies.propertyValue?.([], "synonym")).toEqual({ value: undefined })
  })
  it("различает числовой индекс и строковый ключ зависимого элемента", () => {
    const facts = collectImportDependencyFacts({
      rule: MetadataCatalogRules, owner, yaml: undefined, candidates: [],
      propertyFacts: [
        { itemType: "FormAttribute", itemRule: FormAttributeRules, propertyKey: "type",
          yamlPath: ["Атрибуты", 0, "Тип"], value: "СписокЗначений" },
        { itemType: "FormAttribute", itemRule: FormAttributeRules, propertyKey: "type",
          yamlPath: ["Атрибуты", "0", "Тип"], value: "ТаблицаЗначений" },
      ],
    })
    const dependencies = prepareImportDependencies(facts)
    expect(dependencies.itemFacts?.(["Атрибуты", 0], "FormAttribute"))
      .toEqual({ item: { Тип: "СписокЗначений" }, root: {} })
    expect(dependencies.itemFacts?.(["Атрибуты", "0"], "FormAttribute"))
      .toEqual({ item: { Тип: "ТаблицаЗначений" }, root: {} })
  })

  it("читает подготовленные значения по сегментам без сериализации пути", () => {
    const rule = { itemType: "DirectPath", properties: {
      text: { type: "string", yaml: "Текст", xmlOnly: true },
    } } as const satisfies MetadataItemRule
    const facts = collectImportDependencyFacts({
      rule, owner, yaml: undefined, candidates: [],
      proofPropertyFacts: [{ itemType: rule.itemType, itemRule: rule, propertyKey: "text",
        yamlPath: ["Объекты/~", "Первый:1", "Текст"], sourceYamlPath: ["Объекты/~", 0, "Текст"],
        value: "сохранено" }],
    })
    const dependencies = prepareImportDependencies(facts)
    const path = ["Объекты/~", "Первый:1"]
    const map = vi.spyOn(path, "map")
    try {
      const value = dependencies.propertyValue?.(path, "text")
      expect(value).toEqual({ value: "сохранено" })
      expect(dependencies.propertyValue?.(["Объекты/~", 0], "text")).toBe(value)
      expect(dependencies.propertyValue?.(["Объекты", "Первый:1"], "text")).toEqual({ value: undefined })
      for (let index = 0; index < 10; index++) expect(dependencies.propertyValue?.(path, "text")).toBe(value)
      expect(map).not.toHaveBeenCalled()
    } finally { map.mockRestore() }
  })

  it.each(["скаляр", [], null])("не создаёт решение для поля внутри не-объекта: %o", (value) => {
    const facts = collectNestedTextAbsenceFacts([{ itemType: "Root", propertyKey: "item", yamlPath: ["Элемент"], value }])
    expect(facts.finalProperties.size).toBe(0)
  })

  it.each([false, true])("сохраняет различие undefined при явном контейнере: %s", (container) => {
    const facts = collectNestedTextAbsenceFacts([
        ...(container ? [{ itemType: "Root", propertyKey: "$container:item", yamlPath: ["Элемент"], value: {} }] : []),
        { itemType: "Nested", propertyKey: "name", yamlPath: ["Элемент", "Имя"], value: "Имя" },
        { itemType: "Nested", propertyKey: "text",
          yamlPath: ["Элемент", "Текст"], value: undefined, presentInXML: true },
    ])
    expect(prepareImportDependencies(facts).propertyValue?.(["Элемент"], "text"))
      .toEqual(container ? { value: undefined } : { present: false, value: undefined })
  })

  it("читает окончательное значение из фактов без YAML-представления", () => {
    const rule = { itemType: "Root", properties: { text: { type: "string", yaml: "Текст" } } } as const satisfies MetadataItemRule
    const facts = collectImportDependencyFacts({
      rule, owner, yaml: undefined, candidates: [],
      finalRootYaml: { get Текст(): unknown { throw new Error("Прежнее представление не нужно") } },
      propertyFacts: [{ itemType: "Root", itemRule: rule, propertyKey: "text", yamlPath: ["Текст"], value: "исходное" }],
      finalPropertyFacts: [{ itemType: "Root", itemRule: rule, propertyKey: "text", yamlPath: ["Текст"], value: "окончательное" }],
    })
    expect(prepareImportDependencies(facts).propertyValue?.([], "text")).toEqual({ present: true, value: "окончательное" })
  })

  it.each([
    { preserveEmptyXML: false, presentInXML: false },
    { preserveEmptyXML: true, presentInXML: true },
    { preserveEmptyXML: true, presentInXML: false, reconstructionValue: "сохранено" },
  ])("не читает вложенный YAML без необходимости решения об отсутствии: %o", (flags) => {
    const rootRule = { itemType: "Root", properties: {} } satisfies MetadataItemRule
    const nestedRule = { itemType: "Nested", properties: {
      text: { type: "string", yaml: "Текст", preserveEmptyXML: flags.preserveEmptyXML },
    } } satisfies MetadataItemRule
    let reads = 0
    const facts = collectImportDependencyFacts({
      rule: rootRule, owner, yaml: {}, candidates: [],
      finalRootYaml: { get Элементы() { reads++; return { Первый: {} } } },
      proofPropertyFacts: [{
        itemType: nestedRule.itemType, itemRule: nestedRule, propertyKey: "text",
        yamlPath: ["Элементы", "Первый", "Текст"], value: undefined,
        presentInXML: flags.presentInXML,
        ...("reconstructionValue" in flags ? { reconstructionValue: flags.reconstructionValue } : {}),
      }],
    })
    expect(facts.finalProperties.size).toBe(0)
    expect(reads).toBe(0)
  })

  it("не удерживает неизменённое независимое значение корня как решение второго прохода", () => {
    const rule = { itemType: "IndependentRoot", properties: { text: { type: "string", yaml: "Текст" } } } as const satisfies MetadataItemRule
    const value = "Большой независимый текст".repeat(1000)
    const facts = collectImportDependencyFacts({
      rule, owner, yaml: { Текст: value }, finalRootYaml: { Текст: value }, candidates: [],
      propertyFacts: [{ itemType: rule.itemType, itemRule: rule, propertyKey: "text", yamlPath: ["Текст"], value, presentInXML: true }],
    })
    expect(facts.finalProperties.size).toBe(0)
    expect(facts.proofProperties.size).toBe(0)
    expect(prepareImportDependencies(facts).propertyValue?.([], "text")).toEqual({ value: undefined })
  })

  it("сохраняет отличающееся окончательное значение корня", () => {
    const rule = { itemType: "FinalRoot", properties: { text: { type: "string", yaml: "Текст" } } } as const satisfies MetadataItemRule
    const facts = collectImportDependencyFacts({
      rule, owner, yaml: { Текст: "исходное" }, finalRootYaml: { Текст: "окончательное" }, candidates: [],
      propertyFacts: [{ itemType: rule.itemType, itemRule: rule, propertyKey: "text", yamlPath: ["Текст"], value: "исходное", presentInXML: true }],
    })
    expect(prepareImportDependencies(facts).propertyValue?.([], "text"))
      .toEqual({ present: true, value: "окончательное" })
  })

  it("сохраняет явный undefined внутри выбранного XML-only массива", () => {
    const rule = { itemType: "ProofArray", properties: {
      values: { type: "string", yaml: "Значения", xmlOnly: true },
    } } as const satisfies MetadataItemRule
    const facts = collectImportDependencyFacts({
      rule, owner, yaml: {}, candidates: [], propertyFacts: [{
        itemType: rule.itemType, itemRule: rule, propertyKey: "$container:values", yamlPath: ["Значения"], value: [],
      }, {
        itemType: rule.itemType, itemRule: rule, propertyKey: "values", yamlPath: ["Значения", 0], value: undefined, presentInXML: true,
      }],
    })
    expect(prepareImportDependencies(facts).propertyValue?.([], "values")).toEqual({ value: [undefined] })
  })

  it("читает выбранные XML-only листья однократно и разделяет результат между адресами", () => {
    const rule = {
      itemType: "SelectedProof",
      properties: { names: { type: "string", yaml: "Имена", xmlOnly: true } },
    } as const satisfies MetadataItemRule
    let reads = 0
    const names = Array.from({ length: 64 }, (_, index) => `Имя${index}`)
    const facts = collectImportDependencyFacts({
      rule, owner, yaml: {}, candidates: [],
      propertyFacts: [{
        itemType: rule.itemType, itemRule: rule, propertyKey: "$container:names",
        yamlPath: ["Объекты", "Первый", "Имена"], sourceYamlPath: ["Объекты", 0, "Имена"], value: [],
      }, ...names.map((name, index): DirectImportPropertyFact => ({
        itemType: rule.itemType, itemRule: rule, propertyKey: "names",
        yamlPath: ["Объекты", "Первый", "Имена", index], sourceYamlPath: ["Объекты", 0, "Имена", index],
        get value() { reads++; return name },
      }))],
    })
    const dependencies = prepareImportDependencies(facts)
    expect(dependencies.propertyValue?.(["Объекты", "Первый"], "names")).toEqual({ value: names })
    expect(dependencies.propertyValue?.(["Объекты", 0], "names"))
      .toBe(dependencies.propertyValue?.(["Объекты", "Первый"], "names"))
    expect(reads).toBe(names.length)
  })

  it("ищет владельца выбранного значения без копирования каждого префикса пути", () => {
    const rule = { itemType: "DeepProof", properties: {
      text: { type: "string", yaml: "Текст", xmlOnly: true },
    } } as const satisfies MetadataItemRule
    const path = [...Array.from({ length: 200 }, (_, index) => `Узел${index}`), "Текст"]
    let copiedSegments = 0
    const slice = Array.prototype.slice
    const spy = vi.spyOn(Array.prototype, "slice").mockImplementation(function (this: unknown[], start, end) {
      const result = slice.call(this, start, end)
      if (this[0] === "Узел0") copiedSegments += result.length
      return result
    })
    try {
      const facts = collectImportDependencyFacts({
        rule, owner, yaml: undefined, candidates: [],
        proofPropertyFacts: [{ itemType: rule.itemType, itemRule: rule, propertyKey: "text", yamlPath: path, value: "сохранено" }],
      })
      const value = prepareImportDependencies(facts).propertyValue?.(path.slice(0, -1), "text")
      spy.mockRestore()
      expect(value).toEqual({ value: "сохранено" })
      expect(copiedSegments).toBeLessThanOrEqual(path.length * 8)
    } finally {
      spy.mockRestore()
    }
  })

  it("не читает обычное независимое поле ради сохранённой копии для proof", () => {
    const rule = {
      itemType: "Independent",
      properties: { title: { type: "string", yaml: "Заголовок" } },
    } as const satisfies MetadataItemRule
    const facts = collectImportDependencyFacts({
      rule, owner, yaml: {}, candidates: [],
      propertyFacts: [{
        itemType: rule.itemType,
        itemRule: rule,
        propertyKey: "title",
        yamlPath: ["Заголовок"],
        get value(): string { throw new Error("Независимое поле не должно копироваться в proofProperties") },
      }],
    })
    expect(facts.proofProperties.size).toBe(0)
  })

  it("читает каждый элемент выбранного составного типа один раз", () => {
    const rule = typedItemRule
    let reads = 0
    const values = Array.from({ length: 64 }, (_, index) => `Справочник.Товар${index}`)
    const facts = collectImportDependencyFacts({
      rule, owner, candidates: [], yaml: {}, proofPropertyFacts: [],
      propertyFacts: [{
        itemType: rule.itemType, itemRule: rule, propertyKey: "$container:type",
        yamlPath: ["Реквизиты", "Товар", "Тип"], value: [],
      }, ...values.map((value, index): DirectImportPropertyFact => ({
        itemType: rule.itemType, itemRule: rule, propertyKey: "type",
        yamlPath: ["Реквизиты", "Товар", "Тип", index],
        get value() { reads++; return value },
      }))],
    })
    expect(prepareImportDependencies(facts).propertyValue?.(["Реквизиты", "Товар"], "type"))
      .toEqual({ value: values })
    expect(reads).toBe(values.length)
  })

  it.each([
    [[{ path: [], value: "Справочник.Товары" }], "Справочник.Товары"],
    [[{ path: [0], value: "Справочник.Товары" }, { path: [1], value: "Строка" }], ["Справочник.Товары", "Строка"]],
    [[{ path: [], value: [] }], []],
    [[{ path: [0], value: undefined }], [undefined]],
  ])("читает только факты типа для владельца ссылки: %j", (values, expected) => {
    const rule = typedItemRule
    const facts = collectImportDependencyFacts({
      rule, owner, candidates: [], yaml: {}, proofPropertyFacts: [],
      propertyFacts: [
        ...(Array.isArray(expected) ? [{
          itemType: rule.itemType, itemRule: rule, propertyKey: "$container:type",
          yamlPath: ["Реквизиты", "Товар", "Тип"], value: [],
        }] : []),
        ...values.map(({ path, value }): DirectImportPropertyFact => ({
          itemType: rule.itemType, itemRule: rule, propertyKey: "type",
          yamlPath: ["Реквизиты", "Товар", "Тип", ...path],
          sourceYamlPath: ["Реквизиты", 0, "Тип", ...path], value, presentInXML: true,
        })),
        { itemType: rule.itemType, itemRule: rule, propertyKey: "form", yamlPath: ["Форма"],
          get value() { throw new Error("Значение ссылки не нужно для определения её владельца") } },
      ],
    })
    expect(prepareImportDependencies(facts).propertyValue?.(["Реквизиты", "Товар"], "type"))
      .toEqual({ value: expected })
    expect(prepareImportDependencies(facts).propertyValue?.(["Реквизиты", 0], "type"))
      .toBe(prepareImportDependencies(facts).propertyValue?.(["Реквизиты", "Товар"], "type"))
  })

  it.each([
    ["MetadataAttribute", "Получатель", { item: ["Тип"], root: [] }],
    ["StandardAttributeDescription", "Владелец", { item: [], root: ["Владельцы"] }],
    ["StandardAttributeDescription", "Код", { item: [], root: ["ТипКода", "ДлинаКода", "ДопустимаяДлинаКода"] }],
    ["StandardAttributeDescription", "Неизвестный", { item: [], root: [] }],
  ])("объявляет зависимости до чтения YAML: %s %s", (itemType, itemName, expected) => {
    expect(dependentImportDependencies({
      itemType, itemName, itemYamlPath: [], rootRule: MetadataCatalogRules, owner,
    })).toEqual(expected)
  })

  it("готовит факты отсутствующего зависимого свойства по исходному адресу item", () => {
    const facts = collectImportDependencyFacts({
      rule: MetadataCatalogRules, owner, candidates: [],
      yaml: { get Атрибуты(): unknown { throw new Error("Зависимость должна читаться из выбранного факта") } },
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
    const map = vi.spyOn(Array.prototype, "map")
    let prepared: ReturnType<NonNullable<typeof dependencies.itemFacts>>
    let mappedPaths: number
    try {
      prepared = dependencies.itemFacts?.(["Атрибуты", 0], "FormAttribute")
      mappedPaths = map.mock.calls.length
    } finally { map.mockRestore() }
    expect(mappedPaths).toBe(0)
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
    const dependencies = prepareImportDependencies(facts)
    const map = vi.spyOn(candidate.itemYamlPath, "map")
    try {
      expect(dependencies.shouldOmit(candidate, { ВводПоСтроке: value })).toBe(omitted)
      expect(map).not.toHaveBeenCalled()
    } finally { map.mockRestore() }
    expect([...facts.properties.values()].map(entry => entry.facts)).toEqual([
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
      propertyFacts: [{
        itemType: "MetadataAttribute", propertyKey: "type",
        yamlPath: ["Реквизиты", "Получатель", "Тип"], value: "Строка(10)",
      }, {
        itemType: "Independent", propertyKey: "title", yamlPath: ["Постороннее"],
        get value() { throw new Error("Значение без потребителя зависимостей не должно читаться") },
      }],
      proofPropertyFacts: [],
    })
    expect([...facts.properties.values()].map(entry => entry.facts)).toEqual([{ item: { Тип: "Строка(10)" }, root: {} }])
    const dependencies = prepareImportDependencies(facts)
    const map = vi.spyOn(candidate.itemYamlPath, "map")
    try {
      expect(dependencies.shouldOmit(candidate, { ЗначениеЗаполнения: "" })).toBe(true)
      expect(dependencies.shouldOmit(candidate, { ЗначениеЗаполнения: "новое" })).toBe(false)
      expect(map).not.toHaveBeenCalled()
    } finally { map.mockRestore() }
  })

  it("использует окончательное имя элемента коллекции для зависимого свойства", () => {
    const candidate: ImportedDependentPropertyCandidate = {
      itemType: "StandardAttributeDescription", itemName: "Owner", itemYamlPath: ["СтандартныеРеквизиты", 0],
      propertyKey: "fillValue", yamlPath: ["СтандартныеРеквизиты", 0, "ЗначениеЗаполнения"],
      presentInXML: true, xmlValue: { "_xsi:type": "xr:DesignTimeRef", "#text": "Catalog.Владельцы.EmptyRef" },
    }
    const map = vi.spyOn(candidate.yamlPath, "map")
    const facts = collectImportDependencyFacts({
      rule: MetadataCatalogRules, owner, candidates: [candidate],
      yaml: {
        Владельцы: ["Справочник.Владельцы"],
        СтандартныеРеквизиты: [{ ЗначениеЗаполнения: "Справочник.Владельцы.ПустаяСсылка" }],
      },
      propertyFacts: [{
        itemType: "MetadataCatalog", propertyKey: "owners", yamlPath: ["Владельцы"], value: ["Справочник.Владельцы"],
      }, {
        itemType: "StandardAttributeDescription", itemRule: StandardAttributeDescriptionRules,
        propertyKey: "fillValue", value: "Справочник.Владельцы.ПустаяСсылка",
        yamlPath: ["СтандартныеРеквизиты", "Владелец", "ЗначениеЗаполнения"],
        sourceYamlPath: ["СтандартныеРеквизиты", 0, "ЗначениеЗаполнения"],
      }],
    })

    expect(prepareImportDependencies(facts).shouldOmit(candidate, {
      ЗначениеЗаполнения: "Справочник.Владельцы.ПустаяСсылка",
    })).toBe(true)
    const mappedPaths = map.mock.calls.length
    map.mockRestore()
    expect(mappedPaths).toBe(0)
  })

  it("индексирует только запрошенные зависимые свойства одним проходом", () => {
    const count = 64
    let itemTypeReads = 0
    const propertyFacts: DirectImportPropertyFact[] = Array.from({ length: count }, (_, index) => ({
        get itemType() {
          itemTypeReads++
          return "StandardAttributeDescription"
        },
        itemRule: StandardAttributeDescriptionRules,
        propertyKey: "fillValue",
        value: `Значение${index}`,
        yamlPath: ["СтандартныеРеквизиты", `Реквизит${index}`, "ЗначениеЗаполнения"],
        sourceYamlPath: ["СтандартныеРеквизиты", index, "ЗначениеЗаполнения"],
      }))
    const candidates = Array.from({ length: count }, (_, index): ImportedDependentPropertyCandidate => ({
      itemType: "StandardAttributeDescription",
      itemName: `Реквизит${index}`,
      itemYamlPath: ["СтандартныеРеквизиты", index],
      propertyKey: "fillValue",
      yamlPath: ["СтандартныеРеквизиты", index, "ЗначениеЗаполнения"],
      presentInXML: true,
      xmlValue: `Значение${index}`,
    }))
    const yaml = {
      СтандартныеРеквизиты: Array.from({ length: count }, (_, index) => ({
        ЗначениеЗаполнения: `Значение${index}`,
      })),
    }
    propertyFacts.push(...Array.from({ length: 512 }, (_, index): DirectImportPropertyFact => ({
      get itemType() {
        itemTypeReads++
        return "Independent"
      },
      propertyKey: "title",
      yamlPath: ["Посторонние", index, "Заголовок"],
      value: `Заголовок${index}`,
    })))

    const facts = collectImportDependencyFacts({
      rule: MetadataCatalogRules,
      owner,
      candidates,
      yaml,
      propertyFacts,
    })

    expect(facts.properties.size).toBe(count)
    expect(itemTypeReads).toBeLessThan(count * 4)
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

  it.each([
    { xmlOnly: false, value: undefined },
    { xmlOnly: true, value: { Вид: "Цвет", Значение: "Красный" } },
  ])("сохраняет составное свойство только вне смыслового YAML: xmlOnly=$xmlOnly", ({ xmlOnly, value }) => {
    const nestedRule = {
      itemType: "Nested",
      properties: {
        style: {
          type: "StyleItemValue",
          yaml: "Значение",
          ...(xmlOnly ? { xmlOnly: true } : {}),
        },
      },
    } as const satisfies MetadataItemRule
    const facts = collectImportDependencyFacts({
      rule: MetadataCatalogRules,
      owner,
      candidates: [],
      yaml: {},
      proofPropertyFacts: [{
        itemType: nestedRule.itemType,
        itemRule: nestedRule,
        propertyKey: "$container:style",
        value: {},
        yamlPath: ["Элементы", "Первый", "Значение"],
      }, {
        itemType: nestedRule.itemType,
        itemRule: nestedRule,
        propertyKey: "style",
        value: "Цвет",
        yamlPath: ["Элементы", "Первый", "Значение", "Вид"],
      }, {
        itemType: nestedRule.itemType,
        itemRule: nestedRule,
        propertyKey: "style",
        value: "Красный",
        yamlPath: ["Элементы", "Первый", "Значение", "Значение"],
      }],
    })

    expect(prepareImportDependencies(facts).propertyValue?.(["Элементы", "Первый"], "style"))
      .toEqual({ value })
    expect(prepareImportDependencies(facts).propertyValue?.(["Элементы", "Первый"], "$container:style"))
      .toEqual({ value: undefined })
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

function collectNestedTextAbsenceFacts(finalPropertyFacts: readonly DirectImportPropertyFact[]) {
  const nestedRule = { itemType: "Nested", properties: {
    text: { type: "string", yaml: "Текст", preserveEmptyXML: true },
  } } satisfies MetadataItemRule
  return collectImportDependencyFacts({
    rule: { itemType: "Root", properties: {} }, owner, yaml: undefined, candidates: [],
    proofPropertyFacts: [{ itemType: "Nested", itemRule: nestedRule, propertyKey: "text",
      yamlPath: ["Элемент", "Текст"], value: undefined, presentInXML: false }],
    finalPropertyFacts,
  })
}

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
