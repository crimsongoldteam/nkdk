import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { typeFixturesTable } from "./__fixtures__/data"
import { importTypeDescriptionFromYAML } from "./fromYAML"
import { TypeDescriptionYAML } from "./types"
import { markYAMLScalarTag, taggedYAMLScalar, xmlAnomalyTagValue, yamlScalarTagAt } from "@nkdk/runtime"
import { importTaggedTypeDescriptionFromYAML } from "./fromYAML"
import {
  createDirectRoundTripContexts,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "../../../tests/directConversion"
import { createRuleRegistrySet, type MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { metadataRules } from "../../composition/metadataRules"

const importUnsafeTypeDescriptionFromYAML = (value: unknown) =>
  importTypeDescriptionFromYAML(mockContext, mockRule, value as TypeDescriptionYAML)

const restrictedCatalogAttributeRule = {
  type: "TypeDescription",
  allowedTypes: [
    "string",
    "decimal",
    "date",
    "boolean",
    "ValueStorage",
    "UUID",
    "CatalogRef",
    "CatalogRef.*",
    "DefinedType.*",
  ],
} as const

describe("importTypeDescriptionFromYAML", () => {
  it("should parse undefined type description", () => {
    const result = importTypeDescriptionFromYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should parse empty string as undefined", () => {
    const result = importTypeDescriptionFromYAML(mockContext, mockRule, "")
    expect(result).toBeUndefined()
  })

  it("should parse whitespace string as undefined", () => {
    const result = importTypeDescriptionFromYAML(mockContext, mockRule, "   ")
    expect(result).toBeUndefined()
  })

  it.each([
    { ИдентификаторТипа: [] },
    { ИдентификаторТипа: "8c1e3694-da12-44d5-8b1f-d134b89a1282" },
    { ИдентификаторТипа: [123] },
  ])("rejects legacy TypeId object %#", (value) => {
    expect(() => importUnsafeTypeDescriptionFromYAML(value)).toThrow("объектная форма ИдентификаторТипа не поддерживается")
  })

  it.each(typeFixturesTable)("should import type from YAML: $enterprise", ({ internal, YAML: enterprise }) => {
    const result = importTypeDescriptionFromYAML(mockContext, mockRule, enterprise)
    expect(result).toEqual(internal)
  })

  it("should import known system enumeration type from explicit YAML form", () => {
    const result = importTypeDescriptionFromYAML(mockContext, mockRule, "СистемноеПеречисление.ПроверкаЗаполнения")

    expect(result).toEqual({ type: ["FillChecking"] })
  })

  it("should keep system enumeration type with complex suffix unchanged during YAML import", () => {
    const result = importTypeDescriptionFromYAML(
      mockContext,
      mockRule,
      "СистемноеПеречисление.ПроверкаЗаполнения.Anything"
    )

    expect(result).toEqual({ type: ["СистемноеПеречисление.ПроверкаЗаполнения.Anything"] })
  })
})

describe("importTaggedTypeDescriptionFromYAML", () => {
  const typeId = "8c1e3694-da12-44d5-8b1f-d134b89a1282"

  const tagged = (payload: string) => {
    const yaml = { Тип: xmlAnomalyTagValue("xml/type", payload) }
    markYAMLScalarTag(yaml, "Тип", "xml/type")
    return yaml
  }

  it("imports a single TypeId from an exact !xml/reference scalar", () => {
    const yaml = { Тип: xmlAnomalyTagValue("xml/reference", typeId) }
    markYAMLScalarTag(yaml, "Тип", "xml/reference")

    expect(importTaggedTypeDescriptionFromYAML({
      context: mockContext,
      rule: { ...restrictedCatalogAttributeRule, yaml: "Тип" },
      yaml,
      value: yaml.Тип,
    })).toEqual({ type: [], typeId: [typeId] })
  })

  it("imports ordinary types and TypeId from one scalar sequence", () => {
    const yaml = { Тип: ["Строка", xmlAnomalyTagValue("xml/reference", typeId)] }
    markYAMLScalarTag(yaml.Тип, 1, "xml/reference")

    expect(importTaggedTypeDescriptionFromYAML({
      context: mockContext,
      rule: { ...restrictedCatalogAttributeRule, yaml: "Тип" },
      yaml,
      value: yaml.Тип,
    })).toEqual({ type: ["string"], typeId: [typeId] })
  })

  it.each([
    {
      label: "property",
      value: "Строка",
      mark: (yaml: { Тип: unknown }) => markYAMLScalarTag(yaml, "Тип", "изменять"),
    },
    {
      label: "sequence item",
      value: ["Строка"],
      mark: (yaml: { Тип: unknown }) => markYAMLScalarTag(yaml.Тип as unknown[], 0, "изменять"),
    },
  ])("keeps the PropertyState tag on a $label outside TypeDescription semantics", ({ value, mark }) => {
    const yaml = { Тип: value }
    mark(yaml)

    expect(importTaggedTypeDescriptionFromYAML({
      context: mockContext,
      rule: { ...restrictedCatalogAttributeRule, yaml: "Тип" },
      yaml,
      value: yaml.Тип,
    })).toEqual({ type: ["string"] })
  })

  it.each([
    { label: "untagged UUID", value: typeId },
    { label: "UUID under PropertyState", value: typeId, tag: "изменять" },
    { label: "invalid UUID", value: xmlAnomalyTagValue("xml/reference", "not-a-uuid"), tag: "xml/reference" },
    { label: "wrong tag", value: xmlAnomalyTagValue("xml/type", typeId), tag: "xml/type" },
    { label: "legacy object", value: { ИдентификаторТипа: [typeId] } },
  ] as const)("rejects $label TypeId representation", ({ value, tag }) => {
    const yaml = { Тип: value }
    if (tag !== undefined) markYAMLScalarTag(yaml, "Тип", tag)

    expect(() => importTaggedTypeDescriptionFromYAML({
      context: mockContext,
      rule: { type: "TypeDescription", yaml: "Тип" },
      yaml,
      value,
    })).toThrow()
  })

  it("imports an exact generated namespace prefix", () => {
    const yaml = tagged("d7p1:Диаграмма")
    const result = importTaggedTypeDescriptionFromYAML({
      context: mockContext,
      rule: { type: "TypeDescription", yaml: "Тип" },
      yaml,
      value: yaml.Тип,
    })

    expect(result).toEqual({ type: ["Chart"] })
  })

  it("imports an exact prefix from the in-memory tagged scalar", () => {
    const yaml = { Тип: taggedYAMLScalar("xml/type", xmlAnomalyTagValue("xml/type", "d7p1:Диаграмма")) }
    markYAMLScalarTag(yaml, "Тип", "xml/type")

    expect(importTaggedTypeDescriptionFromYAML({
      context: mockContext,
      rule: { type: "TypeDescription", yaml: "Тип" },
      yaml,
      value: yaml.Тип,
    })).toEqual({ type: ["Chart"] })
  })

  it("ignores a stale tag of an omitted type", () => {
    const yaml = { Тип: undefined }
    markYAMLScalarTag(yaml, "Тип", "xml/type")

    expect(importTaggedTypeDescriptionFromYAML({
      context: mockContext,
      rule: { type: "TypeDescription", yaml: "Тип" },
      yaml,
      value: undefined,
    })).toBeUndefined()
  })

  it.each(["Диаграмма", "d7p1:", "d7p1:Chart", "d7p1:Строка", "d7p1:Справочник.Товары", "d6p1:Диаграмма"])(
    "rejects incompatible !xml/type payload %s",
    (payload) => {
      const yaml = tagged(payload)
      expect(() =>
        importTaggedTypeDescriptionFromYAML({
          context: mockContext,
          rule: { type: "TypeDescription", yaml: "Тип" },
          yaml,
          value: yaml.Тип,
        })
      ).toThrow("Тип: недопустимое значение !xml/type")
    }
  )
})

describe("importTypeDescriptionFromYAML with allowedTypes", () => {
  it("imports allowed primitive and catalog reference values", () => {
    expect(
      importTypeDescriptionFromYAML(mockContext, restrictedCatalogAttributeRule, [
        "Строка(10)",
        "Справочник",
        "Справочник.Контрагенты",
      ])
    ).toEqual({
      type: ["string", "CatalogRef", "CatalogRef.Контрагенты"],
      stringQualifiers: { length: 10, allowedLength: "Variable" },
    })
  })

  it("rejects unknown type strings", () => {
    expect(() =>
      importTypeDescriptionFromYAML(mockContext, restrictedCatalogAttributeRule, "НесуществующийТип")
    ).toThrow("TypeDescription YAML value is not allowed by rule.allowedTypes")
  })

  it("rejects single-only values inside composite arrays", () => {
    expect(() =>
      importTypeDescriptionFromYAML(mockContext, restrictedCatalogAttributeRule, ["Строка", "ХранилищеЗначения"])
    ).toThrow("TypeDescription YAML value is not allowed by rule.allowedTypes")
  })

  it("rejects invalid primitive parameter syntax", () => {
    expect(() => importTypeDescriptionFromYAML(mockContext, restrictedCatalogAttributeRule, "Число(abc, 2)")).toThrow(
      "TypeDescription YAML value is not allowed by rule.allowedTypes"
    )
  })

  it("round-trips an allowed tagged prefix inside a compound type", () => {
    const { contexts, execution, imported } = importRestrictedCompound("CatalogRef.Товары")
    const type = (imported.yaml as { Тип: string[] }).Тип

    expect(type).toEqual(["!xml/type d6p1:Справочник.Товары", "Строка"])
    expect(yamlScalarTagAt(type, 0)).toBe("xml/type")

    const exported = testPropertyFromYAMLToXML({
      context: contexts.exportContext(),
      execution,
      rule: restrictedItemRule,
      yaml: imported.yaml,
    })
    const xmlTypes = (exported.xml.Type as Record<string, unknown>)["v8:Type"] as unknown[]
    expect(xmlTypes[0]).toEqual({
      "_xmlns:d6p1": "http://v8.1c.ru/8.1/data/enterprise/current-config",
      "#text": "d6p1:CatalogRef.Товары",
    })
  })

  it("rejects a tagged compound element outside allowedTypes", () => {
    const { contexts, execution, imported } = importRestrictedCompound("DocumentRef.Заказ")

    expect(() => testPropertyFromYAMLToXML({
      context: contexts.exportContext(),
      execution,
      rule: restrictedItemRule,
      yaml: imported.yaml,
    })).toThrow("TypeDescription YAML value is not allowed by rule.allowedTypes")
  })
})

const externalDataSourceRule = {
  type: "TypeDescription",
  allowedTypes: ["ExternalDataSourceTableRef.*", "ExternalDataSourceCubeDimensionTableRef.*"],
} as const

describe("external data source TypeDescription YAML import", () => {
  it("imports external data source table short form", () => {
    expect(
      importTypeDescriptionFromYAML(
        mockContext,
        externalDataSourceRule,
        "ВнешнийИсточникДанныхВсеСвойства.ТаблицаВсеСвойства"
      )
    ).toEqual({
      type: ["ExternalDataSourceTableRef.ВнешнийИсточникДанныхВсеСвойства.ТаблицаВсеСвойства"],
    })
  })

  it("imports external data source table object explicit form", () => {
    expect(
      importTypeDescriptionFromYAML(
        mockContext,
        { type: "TypeDescription" },
        "ВнешнийИсточникДанныхТаблицаОбъект.ВнешнийИсточникДанныхВсеСвойства.ТаблицаВсеСвойства"
      )
    ).toEqual({
      type: ["ExternalDataSourceTableObject.ВнешнийИсточникДанныхВсеСвойства.ТаблицаВсеСвойства"],
    })
  })

  it("imports external data source cube dimension table short form", () => {
    expect(
      importTypeDescriptionFromYAML(
        mockContext,
        externalDataSourceRule,
        "ВнешнийИсточникДанныхВсеСвойства.КубВсеСвойства.ТаблицаИзмеренияВсеСвойства"
      )
    ).toEqual({
      type: [
        "ExternalDataSourceCubeDimensionTableRef.ВнешнийИсточникДанныхВсеСвойства.КубВсеСвойства.ТаблицаИзмеренияВсеСвойства",
      ],
    })
  })

  it("imports external data source cube record manager explicit form", () => {
    expect(
      importTypeDescriptionFromYAML(
        mockContext,
        { type: "TypeDescription" },
        "ВнешнийИсточникДанныхКубМенеджерЗаписи.ВнешнийИсточникДанныхВсеСвойства.КубВсеСвойства"
      )
    ).toEqual({
      type: ["ExternalDataSourceCubeRecordManager.ВнешнийИсточникДанныхВсеСвойства.КубВсеСвойства"],
    })
  })
})

const restrictedItemRule = {
  itemType: "RestrictedTypeDescriptionProbe",
  properties: {
    type: {
      ...restrictedCatalogAttributeRule,
      yaml: "Тип",
      xml: "Type",
      declareTypeNamespaceXML: true,
    },
  },
} as const satisfies MetadataItemRule

function importRestrictedCompound(type: string) {
  const contexts = createDirectRoundTripContexts()
  const execution = createRuleRegistrySet(metadataRules).execution
  const imported = testPropertyFromXMLToYAML({
    context: contexts.importContext,
    execution,
    rule: restrictedItemRule,
    xml: {
      Type: {
        "v8:Type": [
          {
            "_xmlns:d6p1": "http://v8.1c.ru/8.1/data/enterprise/current-config",
            "#text": `d6p1:${type}`,
          },
          "xs:string",
        ],
        "v8:StringQualifiers": {
          "v8:Length": 0,
          "v8:AllowedLength": "Variable",
        },
      },
    },
  })
  return { contexts, execution, imported }
}
