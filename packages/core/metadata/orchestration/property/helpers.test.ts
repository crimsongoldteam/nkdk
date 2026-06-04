import { describe, expect, it } from "vitest"
import {
  applyRequiredXMLParents,
  getOrderedKeysFromXML,
  getOrderedKeysToXML,
  shouldProcessProperty,
  XML_SOURCE_KEYS,
} from "./helpers"
import { setXMLValue } from "./toXML"

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
    }
  >
): any => {
  return {
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
  it("возвращает ключи в порядке сортировки по XML-именам, когда xml не передан", () => {
    const rule = createRule({
      firstName: { xml: "Имя" },
      lastName: { xml: "Фамилия" },
      age: {}, // будет использовано Capitalize("age") => "Age"
    })

    const result = getOrderedKeysFromXML({
      rule,
      xml: undefined,
    })

    // Ожидаем порядок по отсортированным XML-ключам
    expect(result).toEqual(["age", "firstName", "lastName"])
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
  it("без reference ставит InternalInfo перед ordered Properties и ChildObjects", () => {
    const rule = createRule({
      name: { xml: "Name", xmlParents: ["Properties"], order: 1 },
      internalInfo: { xml: "InternalInfo" },
      dimensions: { xml: "Dimension", xmlParents: ["ChildObjects"] },
    })

    const result = getOrderedKeysToXML({
      rule,
      referenceMetadata: undefined,
    })

    expect(result).toEqual(["internalInfo", "name", "dimensions"])
  })

  it("без reference сортирует Properties перед ChildObjects даже если ChildObjects объявлен раньше", () => {
    const rule = createRule({
      dimensions: { xml: "Dimension", xmlParents: ["ChildObjects"] },
      name: { xml: "Name", xmlParents: ["Properties"] },
    })

    const result = getOrderedKeysToXML({
      rule,
      referenceMetadata: undefined,
    })

    expect(result).toEqual(["name", "dimensions"])
  })

  it("с reference сохраняет порядок ключей referenceMetadata главным", () => {
    const rule = createRule({
      name: { xml: "Name", xmlParents: ["Properties"], order: 1 },
      internalInfo: { xml: "InternalInfo" },
      dimensions: { xml: "Dimension", xmlParents: ["ChildObjects"] },
    })

    const result = getOrderedKeysToXML({
      rule,
      referenceMetadata: {
        itemType: "Recalculation",
        name: "Имя",
        internalInfo: {},
        dimensions: [],
      },
    })

    expect(result).toEqual(["name", "internalInfo", "dimensions"])
  })
})

describe("applyRequiredXMLParents", () => {
  it("plain-array entries создаются независимо от тега", () => {
    const result: any = {}
    applyRequiredXMLParents(result, [["ChildObjects"]], ["Form"])
    expect(result).toEqual({ ChildObjects: {} })
  })

  it("tagged entries создаются только при совпадении тега", () => {
    const result: any = {}
    applyRequiredXMLParents(result, [{ path: ["Attributes"], tag: "Form" }], ["Form"])
    expect(result).toEqual({ Attributes: {} })
  })

  it("tagged entries пропускаются при несовпадении тега", () => {
    const result: any = {}
    applyRequiredXMLParents(result, [{ path: ["Attributes"], tag: "Form" }], ["Metadata"])
    expect(result).toEqual({})
  })

  it("не перезаписывает уже существующий узел", () => {
    const existing = { Attribute: [{ _name: "foo" }] }
    const result: any = { Attributes: existing }
    applyRequiredXMLParents(result, [{ path: ["Attributes"], tag: "Form" }], ["Form"])
    expect(result.Attributes).toBe(existing)
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

describe("setXMLValue", () => {
  it("при пустом массиве + xmlParents + defaultValueXMLRaw создаёт пустой контейнер", () => {
    const xml: any = {}
    const rule: any = { xmlParents: ["ChildObjects"], defaultValueXMLRaw: {} }
    setXMLValue("attributes", xml, rule, [])
    expect(xml).toEqual({ ChildObjects: {} })
  })

  it("при пустом массиве + xmlParents без defaultValueXMLRaw ничего не добавляет", () => {
    const xml: any = {}
    const rule: any = { xmlParents: ["ChildObjects"] }
    setXMLValue("attributes", xml, rule, [])
    expect(xml).toEqual({})
  })

  it("при пустом массиве без xmlParents ничего не добавляет", () => {
    const xml: any = {}
    const rule: any = { defaultValueXMLRaw: {} }
    setXMLValue("attributes", xml, rule, [])
    expect(xml).toEqual({})
  })

  it("при непустом массиве помещает значение в xmlParents-контейнер", () => {
    const xml: any = {}
    const rule: any = { xmlParents: ["ChildObjects"], xml: "Attribute" }
    setXMLValue("attributes", xml, rule, [{ _uuid: "abc" }])
    expect(xml).toEqual({ ChildObjects: { Attribute: [{ _uuid: "abc" }] } })
  })

  it("при значении undefined ничего не добавляет", () => {
    const xml: any = {}
    const rule: any = {}
    setXMLValue("name", xml, rule, undefined)
    expect(xml).toEqual({})
  })
})
