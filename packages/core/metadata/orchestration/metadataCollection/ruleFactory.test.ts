import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { importPropertyFromXML, PropertyRule } from ".."
import { exportPropertyToJSONSchema } from "../property/toJSONSchema"
import type { MetadataItemRule } from "../property/types"
import { mockContextFromXML } from "../../../tests/mockContext"
import { registerMetadataItemCollectionRule } from "./ruleFactory"

// Минимальное правило одиночного элемента для тестов коллекции.
// itemType и propertyType намеренно не заведены в MetadataItemTypeRegistry/PropertyTypeRegistry —
// тест проверяет только механику расплющивания входного XML, и нам достаточно прямой регистрации
// правила через registerMetadataItemCollectionRule. Приведение `as MetadataItemRule` отключает
// строгую проверку itemType на принадлежность глобальному реестру.
const TestCollectionItemRules = {
  itemType: "TestCollectionItem",
  properties: {
    name: {
      type: "string",
      xml: "Name",
      yaml: "name",
      required: true,
    },
    value: {
      type: "string",
      xml: "Value",
      yaml: "value",
    },
  },
} as unknown as MetadataItemRule

const TestRecursiveArrayItemRules = {
  itemType: "TestRecursiveArrayItem",
  properties: {
    name: {
      type: "string",
      yaml: "name",
    },
    children: {
      type: "TestRecursiveArrayCollection" as any,
      yaml: "children",
    },
  },
} as unknown as MetadataItemRule

// Регистрируем разовый тип для тестов. propertyType намеренно не добавлен в реестры
// (PropertyTypeRegistry/MetadataItemTypeRegistry), потому что в тестах мы дёргаем
// registerTypeRule напрямую и обращаемся к нему через importPropertyFromXML с `rule.type`.
registerMetadataItemCollectionRule({
  propertyType: "TestCollection" as any,
  itemRule: TestCollectionItemRules,
  xmlElement: "Item",
  keyField: "name",
})

registerMetadataItemCollectionRule({
  propertyType: "TestArrayCollection" as any,
  itemRule: TestCollectionItemRules,
  xmlElement: "Item",
  yamlAsArray: true,
})

registerMetadataItemCollectionRule({
  propertyType: "TestRecursiveArrayCollection" as any,
  itemRule: TestRecursiveArrayItemRules,
  xmlElement: "Item",
  yamlAsArray: true,
})

const rule: PropertyRule = { type: "TestCollection" as any }
const arrayRule: PropertyRule = { type: "TestArrayCollection" as any }
const recursiveArrayRule: PropertyRule = { type: "TestRecursiveArrayCollection" as any }

describe("registerMetadataItemCollectionRule default fromXML", () => {
  it("импортирует обычный объект-контейнер {Item: body}", () => {
    const xml = { Item: { Name: "A" } }
    const result = importPropertyFromXML({ context: mockContextFromXML(), rule, value: xml })
    expect(result).toEqual([{ itemType: "TestCollectionItem", name: "A" }])
  })

  it("импортирует контейнер со списком {Item: [body, body]}", () => {
    const xml = { Item: [{ Name: "A" }, { Name: "B", Value: "v" }] }
    const result = importPropertyFromXML({ context: mockContextFromXML(), rule, value: xml })
    expect(result).toEqual([
      { itemType: "TestCollectionItem", name: "A" },
      { itemType: "TestCollectionItem", name: "B", value: "v" },
    ])
  })

  it("импортирует одиночное тело без обёртки (parent уже вытащил содержимое)", () => {
    const xml = { Name: "A", Value: "v" }
    const result = importPropertyFromXML({ context: mockContextFromXML(), rule, value: xml })
    expect(result).toEqual([{ itemType: "TestCollectionItem", name: "A", value: "v" }])
  })

  it("расплющивает массив обёрток [{Item: body}, {Item: body}] (форма от isArray-тегов)", () => {
    // Такую форму порождает XML-парсер для тегов, помеченных options.isArray:
    // содержимое тега всегда массив, даже для одного вхождения, и каждый элемент массива
    // содержит вложенный тег со своим телом.
    const xml = [{ Item: { Name: "A" } }, { Item: { Name: "B" } }]
    const result = importPropertyFromXML({ context: mockContextFromXML(), rule, value: xml })
    expect(result).toEqual([
      { itemType: "TestCollectionItem", name: "A" },
      { itemType: "TestCollectionItem", name: "B" },
    ])
  })

  it("расплющивает массив обёрток с вложенным массивом [{Item: [body, body]}]", () => {
    // isArray-тег встречается однажды, но внутри него несколько повторяющихся дочерних тегов.
    const xml = [{ Item: [{ Name: "A" }, { Name: "B", Value: "v" }] }]
    const result = importPropertyFromXML({ context: mockContextFromXML(), rule, value: xml })
    expect(result).toEqual([
      { itemType: "TestCollectionItem", name: "A" },
      { itemType: "TestCollectionItem", name: "B", value: "v" },
    ])
  })

  it("расплющивает массив обёрток с одиночной записью [{Item: body}] (типичный ChildItems)", () => {
    const xml = [{ Item: { Name: "A" } }]
    const result = importPropertyFromXML({ context: mockContextFromXML(), rule, value: xml })
    expect(result).toEqual([{ itemType: "TestCollectionItem", name: "A" }])
  })

  it("массив тел без обёрток [body, body] передаётся без расплющивания", () => {
    // Если записи массива уже являются телами (нет ключа effectiveElement), движок
    // не должен пытаться что-то расплющить и должен передать массив как есть.
    const xml = [{ Name: "A" }, { Name: "B" }]
    const result = importPropertyFromXML({ context: mockContextFromXML(), rule, value: xml })
    expect(result).toEqual([
      { itemType: "TestCollectionItem", name: "A" },
      { itemType: "TestCollectionItem", name: "B" },
    ])
  })

  it("возвращает undefined для undefined", () => {
    const result = importPropertyFromXML({ context: mockContextFromXML(), rule, value: undefined })
    expect(result).toBeUndefined()
  })
})

describe("registerMetadataItemCollectionRule default toJSONSchema", () => {
  const context = {
    defaultLanguage: "ru",
    version: "2.20",
  } as const

  it("exports record schema for record YAML collections", () => {
    const schema = exportPropertyToJSONSchema({ context, rule, value: undefined })
    const compiled = TypeCompiler.Compile(schema!)

    expect(compiled.Check({ A: { name: "A" } })).toBe(true)
    expect(compiled.Check([{ name: "A" }])).toBe(false)
  })

  it("exports array schema for yamlAsArray collections", () => {
    const schema = exportPropertyToJSONSchema({ context, rule: arrayRule, value: undefined })
    const compiled = TypeCompiler.Compile(schema!)

    expect(compiled.Check([{ name: "A" }])).toBe(true)
    expect(compiled.Check({ A: { name: "A" } })).toBe(false)
  })

  it("exports array schema inside recursive yamlAsArray collections", () => {
    const schema = exportPropertyToJSONSchema({ context, rule: recursiveArrayRule, value: undefined })
    const compiled = TypeCompiler.Compile(schema!)

    expect(compiled.Check([{ name: "A", children: [] }])).toBe(true)
    expect(compiled.Check([{ name: "A", children: { B: {} } }])).toBe(false)
  })
})
