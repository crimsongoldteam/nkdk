import { describe, expect, it } from "vitest"

import type { ConfigurationContextWithExportToXML } from "../../context/types"
import { convertPropertiesFromYAMLToXML } from "../../orchestration/property/fromYAMLToXML"
import type { MetadataItemRule } from "../../orchestration/property/types"
import type { PropertyRule } from "../../orchestration"
import { testExportPropertyModelThroughYAMLToXML } from "../../../tests/property/exportPropertyModelThroughYAMLToXML"
import { accountingExtDimensions, all, allYAML, minimal, minimalYAML, multiple } from "./__fixtures__/data"
import { fillValueEmptyRefTypeLoss } from "./__fixtures__/fillValueEmptyRefTypeLoss"
import {
  MetadataAccountingRegisterStandardAttributeNames,
  MetadataAccountingRegisterStandardAttributeNamesXML,
} from "../../appliedObjects/metadataAccountingRegister/rules"
import { StandardAttributeDescriptionRules } from "./rules"
import { StandartAttributeNameToYAML } from "./types"

const context: ConfigurationContextWithExportToXML = {
  defaultLanguage: "ru",
  version: "2.20",
  exportToXML: { configDumpInfo: new Map(), version: "2.20", itemsTree: [] },
}

describe("StandardAttributeDescriptions direct YAML to XML", () => {
  const rule: PropertyRule = {
    type: "StandardAttributeDescriptions",
    standartAttributeNames: StandartAttributeNameToYAML,
  }

  it("exports all.xml from YAML", () => {
    const { expectedResult, result } = testExportPropertyModelThroughYAMLToXML({
      rule,
      value: all,
      yaml: allYAML,
      xmlRootTag: "StandardAttributes",
      path: "all.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports multiple.xml from YAML", () => {
    const { expectedResult, result } = testExportPropertyModelThroughYAMLToXML({
      rule: {
        type: "StandardAttributeDescriptions",
        standartAttributeNames: {
          PredefinedDataName: "ИмяПредопределенныхДанных",
          Predefined: "Предопределенный",
        },
      },
      value: multiple,
      yaml: {
        ИмяПредопределенныхДанных: {
          ПроверкаЗаполнения: "ВыдаватьОшибку",
          Синоним: "Какой-то синоним",
        },
        Предопределенный: {
          Синоним: "Другой какой-то синоним",
        },
      },
      xmlRootTag: "StandardAttributes",
      path: "multiple.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports minimal fixture from YAML", () => {
    const { expectedResult, result } = testExportPropertyModelThroughYAMLToXML({
      rule: {
        type: "StandardAttributeDescriptions",
        standartAttributeNames: { PredefinedDataName: "ИмяПредопределенныхДанных" },
      },
      value: minimal,
      yaml: minimalYAML,
      xmlRootTag: "StandardAttributes",
      path: "default.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports undefined and empty YAML", () => {
    const results = [undefined, {}].map((yaml) => {
      return testExportPropertyModelThroughYAMLToXML({
        rule,
        value: undefined,
        yaml,
        xmlRootTag: "StandardAttributes",
      }).result
    })
    expect(results).toEqual(["", ""])
  })

  it("exports RecordType among canonical standard attributes", () => {
    const { result } = testExportPropertyModelThroughYAMLToXML({
      rule: {
        type: "StandardAttributeDescriptions",
        standartAttributeNames: {
          RecordType: "ВидДвижения",
          Active: "Активность",
        },
      },
      value: undefined,
      yaml: {
        Активность: { Комментарий: "changed" },
      },
      xmlRootTag: "StandardAttributes",
    })

    expect(result).toContain('<xr:StandardAttribute name="RecordType">')
    expect(result).toContain('<xr:StandardAttribute name="Active">')
    expect(result.indexOf('name="RecordType"')).toBeLessThan(result.indexOf('name="Active"'))
  })

  it("keeps reference order and removes duplicates", () => {
    const xmlString = `<StandardAttributes>
	<xr:StandardAttribute name="Active">
		<xr:Comment>existing active comment</xr:Comment>
	</xr:StandardAttribute>
	<xr:StandardAttribute name="LineNumber"/>
	<xr:StandardAttribute name="RecordType"/>
	<xr:StandardAttribute name="LineNumber"/>
</StandardAttributes>`
    const { result } = testExportPropertyModelThroughYAMLToXML({
      rule: {
        type: "StandardAttributeDescriptions",
        standartAttributeNames: {
          RecordType: "ВидДвижения",
          Active: "Активность",
          LineNumber: "НомерСтроки",
        },
      },
      value: undefined,
      yaml: {
        Активность: { Комментарий: "changed" },
        ВидДвижения: {},
      },
      xmlRootTag: "StandardAttributes",
      xmlString,
    })

    const names = Array.from(result.matchAll(/<xr:StandardAttribute name="([^"]+)"/g), ([, name]) => name)
    expect(names).toEqual(["Active", "LineNumber", "RecordType"])
  })

  it("exports empty reference fill value without type loss", () => {
    const { expectedResult, result } = testExportPropertyModelThroughYAMLToXML({
      rule: {
        type: "StandardAttributeDescriptions",
        standartAttributeNames: { Ref: "Ссылка" },
      },
      value: fillValueEmptyRefTypeLoss,
      yaml: {
        Ссылка: { ЗначениеЗаполнения: "." },
      },
      xmlRootTag: "StandardAttributes",
      path: "fillValueEmptyRefTypeLoss.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("preserves maxValue xsi type from reference", () => {
    const xmlString = '<xr:MaxValue xsi:type="xs:decimal">99.99</xr:MaxValue>'
    const { expectedResult, result } = testExportPropertyModelThroughYAMLToXML({
      rule: StandardAttributeDescriptionRules.properties.maxValue,
      value: 99.99,
      yaml: 99.99,
      xmlRootTag: "xr:MaxValue",
      xmlString,
    })

    expect(result).toEqual(expectedResult)
  })

  it("preserves missing fillValue xsi type from reference", () => {
    const xmlString = '<xr:FillValue xsi:type="v8:TypeDescription"/>'
    const { expectedResult, result } = testExportPropertyModelThroughYAMLToXML({
      rule: StandardAttributeDescriptionRules.properties.fillValue,
      value: undefined,
      yaml: undefined,
      xmlRootTag: "xr:FillValue",
      xmlString,
    })

    expect(result).toEqual(expectedResult)
  })

  it("preserves reference-only collection values", () => {
    const xmlString = `<StandardAttributes>
	<xr:StandardAttribute name="ValueType">
		<xr:Comment>reference-only</xr:Comment>
		<xr:FillValue xsi:type="v8:TypeDescription"/>
	</xr:StandardAttribute>
</StandardAttributes>`
    const { result } = testExportPropertyModelThroughYAMLToXML({
      rule: {
        type: "StandardAttributeDescriptions",
        standartAttributeNames: { ValueType: "ТипЗначения" },
      },
      value: undefined,
      yaml: undefined,
      xmlRootTag: "StandardAttributes",
      xmlString,
    })

    expect(result).toContain('<xr:FillValue xsi:type="v8:TypeDescription"/>')
    expect(result).toContain("<xr:Comment>reference-only</xr:Comment>")
  })

  it("preserves fillValue reference type through changed collection item", () => {
    const xmlString = `<StandardAttributes>
	<xr:StandardAttribute name="ValueType">
		<xr:Comment>before</xr:Comment>
		<xr:FillValue xsi:type="v8:TypeDescription"/>
	</xr:StandardAttribute>
</StandardAttributes>`
    const { result } = testExportPropertyModelThroughYAMLToXML({
      rule: {
        type: "StandardAttributeDescriptions",
        standartAttributeNames: { ValueType: "ТипЗначения" },
      },
      value: undefined,
      yaml: {
        ТипЗначения: { Комментарий: "changed" },
      },
      xmlRootTag: "StandardAttributes",
      xmlString,
    })

    expect(result).toContain("<xr:Comment>changed</xr:Comment>")
    expect(result).toContain('<xr:FillValue xsi:type="v8:TypeDescription"/>')
  })

  it("preserves nil reference XML for empty standard attribute values", () => {
    const xmlString = `<StandardAttributes>
	<xr:StandardAttribute name="Value">
		<xr:FillValue xsi:nil="true"/>
		<xr:MaxValue xsi:nil="true"/>
		<xr:MinValue xsi:nil="true"/>
	</xr:StandardAttribute>
</StandardAttributes>`
    const { result } = testExportPropertyModelThroughYAMLToXML({
      rule: {
        type: "StandardAttributeDescriptions",
        standartAttributeNames: { Value: "Значение" },
      },
      value: undefined,
      yaml: { Значение: {} },
      xmlRootTag: "StandardAttributes",
      xmlString,
    })

    expect(result).toContain('<xr:FillValue xsi:nil="true"/>')
    expect(result).toContain('<xr:MaxValue xsi:nil="true"/>')
    expect(result).toContain('<xr:MinValue xsi:nil="true"/>')
  })

  it("exports explicit accounting ExtDimension attributes with reference", () => {
    const { expectedResult, result } = testExportPropertyModelThroughYAMLToXML({
      rule: {
        type: "StandardAttributeDescriptions",
        standartAttributeNames: {},
      },
      value: accountingExtDimensions,
      yaml: {
        ExtDimension1: {},
        ExtDimensionType1: {},
        ExtDimension50: {},
        ExtDimensionType50: {},
      },
      xmlRootTag: "StandardAttributes",
      path: "accounting-ext-dimensions.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports only explicit accounting ExtDimension attributes without reference", () => {
    const { result } = testExportPropertyModelThroughYAMLToXML({
      rule: {
        type: "StandardAttributeDescriptions",
        standartAttributeNames: MetadataAccountingRegisterStandardAttributeNames,
        standartAttributeNamesXML: MetadataAccountingRegisterStandardAttributeNamesXML,
      },
      value: undefined,
      yaml: {
        Субконто1: { Комментарий: "changed" },
        ВидСубконто4: { Комментарий: "changed" },
      },
      xmlRootTag: "StandardAttributes",
    })

    expect(result).toContain('name="ExtDimension1"')
    expect(result).toContain('name="ExtDimensionType4"')
    expect(result).not.toContain('name="ExtDimension5"')
    expect(result).not.toContain('name="ExtDimensionType50"')
  })

  it("exports explicit high-number accounting ExtDimension attributes without reference", () => {
    const { result } = testExportPropertyModelThroughYAMLToXML({
      rule: {
        type: "StandardAttributeDescriptions",
        standartAttributeNames: MetadataAccountingRegisterStandardAttributeNames,
        standartAttributeNamesXML: MetadataAccountingRegisterStandardAttributeNamesXML,
      },
      value: undefined,
      yaml: {
        Субконто50: {},
        ВидСубконто50: {},
      },
      xmlRootTag: "StandardAttributes",
    })

    expect(result).toContain('<xr:StandardAttribute name="ExtDimension50"/>')
    expect(result).toContain('<xr:StandardAttribute name="ExtDimensionType50"/>')
    expect(result).not.toContain('name="ExtDimension1"')
  })

  it("дополняет изменённую YAML-коллекцию каноническими именами", () => {
    const rule = {
      itemType: "TestItem",
      properties: {
        standardAttributes: {
          type: "StandardAttributeDescriptions",
          yaml: "СтандартныеРеквизиты",
          xml: "StandardAttributes",
          standartAttributeNames: {
            Active: "Активность",
            LineNumber: "НомерСтроки",
          },
        },
      },
    } as const satisfies MetadataItemRule

    const result = convertPropertiesFromYAMLToXML({
      context,
      yaml: {
        СтандартныеРеквизиты: {
          Активность: { Комментарий: "изменён" },
        },
      },
      rule,
      outputs: [{ key: "owner" }],
    })

    const items = result.outputs.get("owner")?.StandardAttributes as {
      "xr:StandardAttribute": Array<Record<string, unknown>>
    }
    expect(items["xr:StandardAttribute"].map((item) => item._name)).toEqual(["Active", "LineNumber"])
    expect(items["xr:StandardAttribute"][0]?.["xr:Comment"]).toBe("изменён")
  })
})
