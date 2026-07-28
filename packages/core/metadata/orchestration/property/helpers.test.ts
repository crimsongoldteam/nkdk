import { describe, expect, it } from "vitest"
import { getOrderedKeysFromXML, getOrderedKeysToXML, shouldProcessProperty, XML_SOURCE_KEYS } from "./helpers"

const createRule = (
  properties: Record<
    string,
    {
      xml?: string
      xmlParents?: string[]
      tag?: string
      runtimeOnly?: true
      syncExternalOnly?: true
      filePath?: string
      order?: number
      toXML?: false
      yaml?: string
      forReferenceOnly?: true
    }
  >,
  xmlOrder?: readonly string[]
): any => {
  return {
    itemType: "TestDirectItem",
    xmlOrder,
    // Остальное для этих тестов не важно, используются только свойства
    properties: Object.fromEntries(
      Object.entries(properties).map(([name, rule]) => [
        name,
        {
          type: "string",
          ...rule,
        },
      ])
    ),
  }
}

describe("getOrderedKeysFromXML", () => {
  it("возвращает ключи в порядке объявления, когда xml не передан", () => {
    const rule = createRule({
      firstName: { xml: "Имя" },
      lastName: { xml: "Фамилия" },
      age: {}, // будет использовано Capitalize("age") => "Age"
    })

    const result = getOrderedKeysFromXML({
      rule,
      xml: undefined,
    })

    expect(result).toEqual(["firstName", "lastName", "age"])
  })

  it("располагает ключи по порядку следования в xml и добавляет отсутствующие в конце", () => {
    const rule = createRule({
      firstName: { xml: "Имя" },
      lastName: { xml: "Фамилия" },
      age: {}, // Age
    })

    const xml = {
      Фамилия: "Иванов",
      Age: 30,
    }

    const result = getOrderedKeysFromXML({
      rule,
      xml,
    })

    // Сначала по порядку ключей в xml, затем оставшиеся свойства
    expect(result).toEqual(["lastName", "age", "firstName"])
  })

  it("игнорирует ключи xml, которых нет в описании свойств", () => {
    const rule = createRule({
      firstName: { xml: "Имя" },
    })

    const xml = {
      Unknown: "value",
      Имя: "Иван",
    }

    const result = getOrderedKeysFromXML({
      rule,
      xml,
    })

    expect(result).toEqual(["firstName"])
  })

  it("учитывает фильтрацию по тегу", () => {
    const rule = createRule({
      visible: { xml: "Visible", tag: "export" },
      hidden: { xml: "Hidden", tag: "internal" },
    })

    const result = getOrderedKeysFromXML({
      rule,
      xml: undefined,
      tags: ["export"],
    })

    expect(result).toEqual(["visible"])
  })

  it("исключает свойства с runtimeOnly из результатов", () => {
    const rule = createRule({
      visible: { xml: "Visible" },
      hidden: { xml: "Hidden", runtimeOnly: true },
    })

    const result = getOrderedKeysFromXML({
      rule,
      xml: undefined,
    })

    expect(result).toEqual(["visible"])
  })

  it("ставит свойство-контейнер перед вложенными свойствами того же XML-узла", () => {
    const rule = createRule({
      attributes: { xml: "Attributes" },
      attributesConditionalAppearance: {
        xml: "ConditionalAppearance",
        xmlParents: ["Attributes"],
      },
    })

    const xml = {
      Attributes: {
        ConditionalAppearance: {
          "dcsset:viewMode": "Normal",
        },
      },
    }

    const result = getOrderedKeysFromXML({
      rule,
      xml,
    })

    expect(result).toEqual(["attributes", "attributesConditionalAppearance"])
  })
})

describe("getOrderedKeysToXML", () => {
  it("использует xmlOrder и дописывает неназванные свойства", () => {
    const rule = createRule(
      {
        name: {},
        group: {},
        title: {},
        unseen: {},
      },
      ["title", "group"]
    )

    expect(getOrderedKeysToXML({ rule })).toEqual(["title", "group", "name", "unseen"])
  })

  it("фильтрует служебные свойства после применения xmlOrder", () => {
    const rule = createRule(
      {
        name: { tag: "form" },
        runtime: { runtimeOnly: true, tag: "form" },
        external: { syncExternalOnly: true, tag: "form" },
        file: { filePath: "Module.bsl", tag: "form" },
        metadata: { tag: "metadata" },
        title: { tag: "form" },
      },
      ["title", "runtime", "external", "file", "metadata", "name"]
    )

    expect(getOrderedKeysToXML({ rule, tag: ["form"] })).toEqual(["title", "name"])
  })

  it("использует порядок объявления вместо порядка XML-имён", () => {
    const rule = createRule({
      lastAlphabetically: { xml: "Zulu" },
      firstAlphabetically: { xml: "Alpha" },
    })

    const result = getOrderedKeysToXML({ rule })

    expect(result).toEqual(["lastAlphabetically", "firstAlphabetically"])
  })

  it("не переставляет свойства по известным XML-контейнерам", () => {
    const rule = createRule({
      dimensions: { xml: "Dimension", xmlParents: ["ChildObjects"] },
      name: { xml: "Name", xmlParents: ["Properties"] },
    })

    const result = getOrderedKeysToXML({ rule })

    expect(result).toEqual(["dimensions", "name"])
  })

  it("сохраняет относительный порядок после фильтрации по tag", () => {
    const rule = createRule({
      first: { tag: "form" },
      skipped: { tag: "metadata" },
      last: { tag: "form" },
    })

    const result = getOrderedKeysToXML({ rule, tag: ["form"] })

    expect(result).toEqual(["first", "last"])
  })
})

describe("shouldProcessProperty preserveFromReferenceXML", () => {
  const preserveRule = {
    type: "boolean",
    fromXML: false,
    preserveFromReferenceXML: true,
    defaultValueXMLRaw: { "_xsi:nil": "true" },
  } as any

  it("экспортирует поле, когда referenceMetadata содержит ключ со значением undefined", () => {
    const result = shouldProcessProperty({
      rule: preserveRule,
      operation: "exportToXML",
      propertyKey: "rowFilter",
      referenceMetadata: { rowFilter: undefined },
    })

    expect(result).toBe(true)
  })

  it("экспортирует поле, когда текущая модель содержит ключ со значением undefined", () => {
    const result = shouldProcessProperty({
      rule: preserveRule,
      operation: "exportToXML",
      propertyKey: "rowFilter",
      metadataItem: { rowFilter: undefined },
    })

    expect(result).toBe(true)
  })

  it("экспортирует поле, когда текущая модель содержит ключ со значением null", () => {
    const result = shouldProcessProperty({
      rule: preserveRule,
      operation: "exportToXML",
      propertyKey: "rowFilter",
      metadataItem: { rowFilter: null },
    })

    expect(result).toBe(true)
  })

  it("не экспортирует поле, когда referenceMetadata не содержит ключ", () => {
    const result = shouldProcessProperty({
      rule: preserveRule,
      operation: "exportToXML",
      propertyKey: "rowFilter",
      referenceMetadata: {},
    })

    expect(result).toBe(false)
  })

  it("не экспортирует поле, когда imported XML reference содержит только модельный ключ без XML source key", () => {
    const referenceMetadata = { rowFilter: undefined }
    Object.defineProperty(referenceMetadata, XML_SOURCE_KEYS, {
      value: {},
      enumerable: false,
    })

    const result = shouldProcessProperty({
      rule: preserveRule,
      operation: "exportToXML",
      propertyKey: "rowFilter",
      referenceMetadata,
    })

    expect(result).toBe(false)
  })

  it("не экспортирует поле без referenceMetadata", () => {
    const result = shouldProcessProperty({
      rule: preserveRule,
      operation: "exportToXML",
      propertyKey: "rowFilter",
    })

    expect(result).toBe(false)
  })

  it("не меняет поведение обычных полей без preserveFromReferenceXML", () => {
    const result = shouldProcessProperty({
      rule: { type: "string" } as any,
      operation: "exportToXML",
      propertyKey: "name",
      referenceMetadata: {},
    })

    expect(result).toBe(true)
  })
})
