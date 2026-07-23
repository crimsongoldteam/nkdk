import { describe, expect, it } from "vitest"

import "../../commonObjects/i8nText/fromXML"
import "../../commonObjects/i8nText/fromYAML"
import "../../commonObjects/i8nText/toXML"
import type { ConfigurationContextWithExportToXML } from "../../context/types"
import type { MetadataItemRule } from "../property/types"
import { convertMetadataItemFromYAMLToXML } from "./fromYAMLToXML"
import { registerTypeRule } from "../property/typeRuleRegistry"
import type { PropertyRuleType } from "../property/registry"
import type { ExportToXMLFunctionNew } from "../property/fn"

const context = (): ConfigurationContextWithExportToXML => ({
  defaultLanguage: "ru",
  version: "2.20",
  exportToXML: { configDumpInfo: new Map(), version: "2.20", itemsTree: [] },
})

const itemRule = {
  itemType: "CatalogAttribute",
  properties: {
    name: { type: "string", xml: "Name" },
    value: { type: "string", yaml: "Значение", xml: "Value" },
  },
} as const satisfies MetadataItemRule

describe("convertMetadataItemFromYAMLToXML", () => {
  it("rejects scalar YAML for metadata items without yamlInline", () => {
    const rule = {
      itemType: "MetadataAttribute",
      properties: {
        type: { yaml: "Тип", xml: "Type", type: "TypeDescription", required: true },
      },
    } as const satisfies MetadataItemRule

    expect(() =>
      convertMetadataItemFromYAMLToXML({
        context: context(),
        yaml: "Справочник.Организации",
        rule,
        name: "Организация",
        outputs: [{ key: "owner" }],
      })
    ).toThrow("MetadataAttribute: ожидался YAML-объект")
  })

  it("формирует metadata-item из YAML и имени записи без модели", () => {
    const result = convertMetadataItemFromYAMLToXML({
      context: context(),
      yaml: { Значение: "A" },
      name: "Первый",
      rule: itemRule,
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({ Name: "Первый", Value: "A" })
  })

  it("создаёт пустой ChildObjects для rule с экспортируемым xmlParents[0] ChildObjects", () => {
    const result = convert({
      itemType: "Recalculation",
      properties: {
        name: { yaml: "Имя", xml: "Name", type: "string", xmlParents: ["Properties"] },
        dimensions: {
          yaml: "Измерения",
          xml: "Dimension",
          type: "string",
          xmlParents: ["ChildObjects"],
        },
      },
    } as MetadataItemRule, { Имя: "Имя" })

    expect(result).toEqual({ Properties: { Name: "Имя" }, ChildObjects: {} })
  })

  it("не создаёт ChildObjects, если единственное ChildObjects-свойство отфильтровано из XML-экспорта", () => {
    const result = convert({
      itemType: "Recalculation",
      properties: {
        name: { yaml: "Имя", xml: "Name", type: "string", xmlParents: ["Properties"] },
        dimensions: {
          yaml: "Измерения",
          xml: "Dimension",
          type: "string",
          xmlParents: ["ChildObjects"],
          toXML: false,
        },
      },
    } as MetadataItemRule, { Имя: "Имя" })

    expect(result).toEqual({ Properties: { Name: "Имя" } })
  })

  it("создаёт пустой ListSettings для rule с экспортируемым вложенным путём ListSettings", () => {
    const result = convert({
      itemType: "Recalculation",
      properties: {
        dataParameters: {
          yaml: "Параметры",
          xml: "dcscor:item",
          type: "string",
          xmlParents: ["ListSettings", "dcsset:dataParameters"],
        },
      },
    } as MetadataItemRule, {})

    expect(result).toEqual({ ListSettings: {} })
  })

  it("deeply preserves unknown nested reference XML while generated fields take precedence", () => {
    const rule = recalculationRule()
    const result = convert(
      rule,
      { Имя: "НовоеИмя", Использование: "Истина", Измерение: "generated" },
      {
        Properties: { Name: "СтароеИмя", UnknownProperty: "keep" },
        ChildObjects: { UnknownChild: "keep-child" },
        UnknownRoot: "keep-root",
      }
    )

    expect(result).toMatchObject({
      Properties: { Name: "НовоеИмя", UnknownProperty: "keep" },
      ChildObjects: { Dimension: "generated", UnknownChild: "keep-child" },
      UnknownRoot: "keep-root",
    })
    expect((result.Properties as Record<string, unknown>).Use).toBeUndefined()
  })

  it("keeps generated rule xsi:type over reference raw xsi:type", () => {
    const result = convert(
      { ...recalculationRule(), xsiType: "GeneratedType" },
      { Имя: "НовоеИмя" },
      { "_xsi:type": "ReferenceType", Properties: { Name: "СтароеИмя" } }
    )

    expect(result).toMatchObject({ "_xsi:type": "GeneratedType", Properties: { Name: "НовоеИмя" } })
  })

  it("keeps ordinary metadata item generation before raw reference fallback", () => {
    const rule = {
      itemType: "Recalculation",
      xsiType: "GeneratedType",
      properties: {
        xmlRoot: {
          type: "XMLRoot",
          container: "Recalculation",
          rootAttributes: { _xmlns: "http://v8.1c.ru/8.3/MDClasses" },
          forReferenceOnly: true,
        },
        name: { yaml: "Имя", xml: "Name", type: "string", xmlParents: ["Properties"] },
      },
    } as const satisfies MetadataItemRule
    const result = convert(rule, { Имя: "Имя" }, {
      MetaDataObject: {
        _xmlns: "http://v8.1c.ru/8.3/MDClasses",
        Recalculation: {
          "_xsi:type": "ReferenceType",
          Properties: { Name: "Имя" },
          UnknownRoot: "keep-root",
        },
      },
    })

    expect(result).toEqual({
      MetaDataObject: {
        _xmlns: "http://v8.1c.ru/8.3/MDClasses",
        Recalculation: {
          "_xsi:type": "GeneratedType",
          Properties: { Name: "Имя" },
          UnknownRoot: "keep-root",
        },
      },
    })
  })

  it("preserves unknown nested reference XML inside a generated object property", () => {
    const result = convert(
      recalculationRule(),
      { Имя: "Имя", Синоним: "НовыйСиноним" },
      {
        Properties: {
          Synonym: {
            "v8:item": { "v8:lang": "ru", "v8:content": "СтарыйСиноним" },
            UnknownNested: "keep-nested",
          },
        },
      }
    )

    expect(result).toMatchObject({
      Properties: {
        Synonym: {
          "v8:item": [{ "v8:lang": "ru", "v8:content": "НовыйСиноним" }],
          UnknownNested: "keep-nested",
        },
      },
    })
  })

  it("exports nested generated fields when they are not XML defaults", () => {
    const result = convert(recalculationRule(), { Имя: "Имя", Использование: "Ложь" }, {
      Properties: { Name: "Имя" },
    })

    expect(result).toEqual({ Properties: { Name: "Имя", Use: false } })
  })

  it("removes reference keys when generated nested field is undefined", () => {
    const rule = {
      ...recalculationRule(),
      properties: {
        ...recalculationRule().properties,
        raw: { yaml: "Raw", xml: "Raw", type: "string", xmlParents: ["Properties"] },
      },
    } as MetadataItemRule
    const result = convert(rule, { Имя: "Имя", Raw: { GeneratedUndefined: undefined } }, {
      Properties: {
        Name: "Имя",
        Raw: { GeneratedUndefined: "remove", UnknownNested: "keep-nested" },
      },
    })

    expect(result).toEqual({
      Properties: { Name: "Имя", Raw: { UnknownNested: "keep-nested" } },
    })
  })

  it("нормализует yamlInline, оборачивает XMLRoot и сохраняет неизвестный XML", () => {
    const rule = {
      itemType: "CatalogAttribute",
      xsiType: "GeneratedType",
      properties: {
        xmlRoot: {
          type: "XMLRoot",
          container: "Attribute",
          rootAttributes: { _xmlns: "generated" },
          forReferenceOnly: true,
        },
        value: { type: "string", yaml: "Значение", xml: "Value", yamlInline: true },
      },
    } as const satisfies MetadataItemRule
    const result = convertMetadataItemFromYAMLToXML({
      context: context(),
      yaml: "новое",
      rule,
      outputs: [
        {
          key: "owner",
          referenceXML: {
            MetaDataObject: {
              _xmlns: "reference",
              Attribute: { Value: "старое", Unknown: "сохранить" },
            },
          },
        },
      ],
    })

    expect(result.outputs.get("owner")).toEqual({
      MetaDataObject: {
        _xmlns: "reference",
        Attribute: {
          "_xsi:type": "GeneratedType",
          Value: "новое",
          Unknown: "сохранить",
        },
      },
    })
  })

  it("связывает отложенное значение с окончательным XML после оборачивания корнем", () => {
    const deferredType = "TestDeferredMetadataItemXML" as PropertyRuleType
    registerTypeRule(deferredType, "exportToXML", (({ value }) => value) as ExportToXMLFunctionNew)
    registerTypeRule(deferredType, "finalizeExportedXML", ({ value }) => value)
    const rule = {
      itemType: "TestRoot",
      properties: {
        xmlRoot: {
          type: "XMLRoot",
          container: "TestRoot",
          rootAttributes: {},
          forReferenceOnly: true,
        },
        value: { type: deferredType, yaml: "Значение", xml: "Value", xmlParents: ["Properties"] },
      },
    } as const satisfies MetadataItemRule

    const converted = convertMetadataItemFromYAMLToXML({
      context: context(),
      yaml: { Значение: "draft" },
      rule,
      outputs: [{ key: "owner" }],
    })
    const deferred = converted.deferredByOutput.get("owner")?.[0]

    expect(deferred?.valuePath).toEqual(["MetaDataObject", "TestRoot", "Properties", "Value"])
    expect(deferred).toHaveProperty("target")
    if (deferred === undefined || !("target" in deferred)) throw new Error("Ожидалась связанная цель")
    const target = deferred.target as { object: Record<string | number, unknown>; key: string | number }
    expect(target.object[target.key]).toBe("draft")
  })
})

function recalculationRule(): MetadataItemRule {
  return {
    itemType: "Recalculation",
    properties: {
      name: { yaml: "Имя", xml: "Name", type: "string", xmlParents: ["Properties"] },
      synonym: { yaml: "Синоним", xml: "Synonym", type: "I8nText", xmlParents: ["Properties"] },
      use: {
        yaml: "Использование",
        xml: "Use",
        type: "boolean",
        xmlParents: ["Properties"],
        defaultValueXML: true,
      },
      dimension: {
        yaml: "Измерение",
        xml: "Dimension",
        type: "string",
        xmlParents: ["ChildObjects"],
      },
    },
  } as MetadataItemRule
}

function convert(rule: MetadataItemRule, yaml: unknown, referenceXML?: unknown): Record<string, unknown> {
  const result = convertMetadataItemFromYAMLToXML({
    context: context(),
    yaml,
    rule,
    outputs: [{ key: "owner", referenceXML }],
  })
  return result.outputs.get("owner") ?? {}
}
