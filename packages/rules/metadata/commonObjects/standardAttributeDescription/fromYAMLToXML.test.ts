import { beforeAll, describe, expect, it } from "vitest"

import type { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import { convertPropertiesFromYAMLToXML } from "../../ruleRuntime/property/fromYAMLToXML"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import type { PropertyRule } from "../../ruleRuntime"
import { testExportPropertyModelThroughYAMLToXML } from "../../../tests/property/exportPropertyModelThroughYAMLToXML"
import {
  createDirectRoundTripContexts,
  serializeDirectXML,
  testMetadataItemFromXMLToYAML,
  testMetadataItemFromYAMLToXML,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "../../../tests/directConversion"
import { readAndParseXMLFixture } from "../../../tests/readFixtureXML"
import { canonicalXML } from "../../../tests/canonicalXML"
import { accountingExtDimensions, all, allYAML, minimal, minimalYAML, multiple } from "./__fixtures__/data"
import { fillValueEmptyRefTypeLoss } from "./__fixtures__/fillValueEmptyRefTypeLoss"
import {
  MetadataAccountingRegisterStandardAttributeNames,
  MetadataAccountingRegisterStandardAttributeNamesXML,
} from "../../appliedObjects/metadataAccountingRegister/rules"
import { StandardAttributeDescriptionRules } from "./rules"
import { StandartAttributeNameToYAML } from "./types"
import { importFromYAML } from "@nkdk/runtime"
import { serializeYAMLDocument } from "@nkdk/runtime"
import { EMPTY_XML_TAG_VALUE } from "@nkdk/runtime"
import { registerMetadataItemCollectionRule } from "../../ruleRuntime/metadataCollection/ruleFactory"
import type { PropertyRuleType } from "@nkdk/runtime/rule-kit"

const context: ConfigurationContextWithExportToXML = {
  defaultLanguage: "ru",
  version: "2.20",
  exportToXML: { version: "2.20", itemsTree: [] },
}

function standardAttributesOwnerRule(
  itemType: string,
  standartAttributeNames: Readonly<Record<string, string>>
): MetadataItemRule {
  return {
    itemType,
    properties: {
      standardAttributes: {
        type: "StandardAttributeDescriptions",
        yaml: "СтандартныеРеквизиты",
        xml: "StandardAttributes",
        standartAttributeNames,
      },
    },
  } as MetadataItemRule
}

function standardAttributeItems(xml: Record<string, unknown>): Array<Record<string, unknown>> {
  return (
    xml.StandardAttributes as {
      "xr:StandardAttribute": Array<Record<string, unknown>>
    }
  )["xr:StandardAttribute"]
}

function roundTripStandardAttributes(itemRule: MetadataItemRule, sourceXML: Record<string, unknown>) {
  const contexts = createDirectRoundTripContexts()
  const imported = testPropertyFromXMLToYAML({
    context: contexts.importContext,
    rule: itemRule,
    xml: sourceXML,
  })
  const exported = testPropertyFromYAMLToXML({
    context: contexts.exportContext(),
    rule: itemRule,
    yaml: imported.yaml,
  })

  return { contexts, exported, imported }
}

const tabularSectionRule = {
  itemType: "StandardAttributesTabularSectionProbe",
  properties: {
    name: { type: "string", yaml: "Имя", xml: "Name" },
    standardAttributes: {
      type: "StandardAttributeDescriptions",
      yaml: "СтандартныеРеквизиты",
      xml: "StandardAttributes",
      standartAttributeNames: { LineNumber: "НомерСтроки" },
    },
  },
} as const satisfies MetadataItemRule

const tabularSectionsType = "StandardAttributesTabularSectionsProbe" as PropertyRuleType

beforeAll(() => {
  registerMetadataItemCollectionRule({
    propertyType: tabularSectionsType,
    itemRule: tabularSectionRule,
    xmlElement: "Item",
    keyField: "name",
    recordYamlKeyFromYAML: ({ name }) => name,
  })
})

const tabularSectionsOwnerRule = {
  itemType: "StandardAttributesOwnerProbe",
  properties: {
    tabularSections: {
      type: tabularSectionsType,
      yaml: "ТабличныеЧасти",
      xml: "TabularSections",
    },
  },
} as MetadataItemRule

describe("StandardAttributeDescriptions direct YAML to XML", () => {
  const rule: PropertyRule = {
    type: "StandardAttributeDescriptions",
    standartAttributeNames: StandartAttributeNameToYAML,
  }

  it("exports all.xml from YAML", () => {
    const { result } = testExportPropertyModelThroughYAMLToXML({
      rule,
      value: all,
      yaml: allYAML,
      xmlRootTag: "StandardAttributes",
      path: "all.xml",
      importMetaUrl: import.meta.url,
    })

    expect([...result.matchAll(/<xr:StandardAttribute name="([^"]+)">/g)].map((match) => match[1])).toEqual(
      ["Owner", "PredefinedDataName", "Code", "Description", "DeletionMark", "Predefined", "Parent", "Ref", "IsFolder"]
    )
    expect(result).toContain("<xr:Comment>Комментарий</xr:Comment>")
    expect(result).toContain("Catalog.СправочникВладелец.Form.ФормаВыбора")
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
    const { result } = testExportPropertyModelThroughYAMLToXML({
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

    expect(result).toContain('<xr:StandardAttribute name="PredefinedDataName">')
  })

  it("restores empty default synonym when YAML omits it", () => {
    const { result } = testExportPropertyModelThroughYAMLToXML({
      rule: {
        type: "StandardAttributeDescriptions",
        standartAttributeNames: { Number: "Номер" },
      },
      value: undefined,
      yaml: { Номер: { ПроверкаЗаполнения: "ВыдаватьОшибку" } },
      xmlRootTag: "StandardAttributes",
    })

    expect(result).toContain('<xr:StandardAttribute name="Number">')
    expect(result).toContain("<xr:Synonym/>")
    expect(result).not.toContain("<v8:content>Number</v8:content>")
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

  it("строит канонический порядок стандартных реквизитов без снимка", () => {
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
    expect(names).toEqual(["RecordType", "Active", "LineNumber"])
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

  it("exports a tagged forbidden boolean through MetadataValue", () => {
    const item = standardAttributeFillValueXML(`СтандартныеРеквизиты:
  Предопределенный:
    ЗначениеЗаполнения: !xml Ложь
`, { Predefined: "Предопределенный" })

    expect(item["xr:FillValue"]).toEqual({ "_xsi:type": "xs:boolean", "#text": "false" })
  })

  it.each([
    ["DesignTimeRef", { "_xsi:type": "xr:DesignTimeRef" }, "Owner", "Владелец"],
    ["String", { "_xsi:type": "xs:string" }, "Code", "Код"],
    ["TypeDescription", { "_xsi:type": "v8:TypeDescription" }, "ValueType", "ТипЗначения"],
    [
      "Справочник.ПапкиФайлов.ПустаяСсылка",
      { "_xsi:type": "xr:DesignTimeRef", "#text": "Catalog.ПапкиФайлов.EmptyRef" },
      "Owner",
      "Владелец",
    ],
  ] as const)("exports !xml %s as exact FillValue XML", (fillValue, expected, xmlName, yamlName) => {
    const item = standardAttributeFillValueXML(`СтандартныеРеквизиты:
  ${yamlName}:
    ЗначениеЗаполнения: !xml ${fillValue}
`, { [xmlName]: yamlName })

    expect(item["xr:FillValue"]).toEqual(expected)
    expect(JSON.stringify(item["xr:FillValue"])).not.toContain("!xml")
  })

  function standardAttributeFillValueXML(
    yaml: string,
    standartAttributeNames: Record<string, string>,
  ): Record<string, unknown> {
    const collectionRule = {
      itemType: "StandardAttributeXMLTransportProbe",
      properties: {
        standardAttributes: {
          type: "StandardAttributeDescriptions",
          yaml: "СтандартныеРеквизиты",
          xml: "StandardAttributes",
          standartAttributeNames,
        },
      },
    } as const satisfies MetadataItemRule
    const result = convertPropertiesFromYAMLToXML({
      context,
      yaml: importFromYAML(yaml),
      rule: collectionRule,
      outputs: [{ key: "owner" }],
    })
    const rawItem = (result.outputs.get("owner")?.StandardAttributes as {
      "xr:StandardAttribute": Record<string, unknown> | Record<string, unknown>[]
    })["xr:StandardAttribute"]
    return Array.isArray(rawItem) ? rawItem[0]! : rawItem
  }

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

  it("uses canonical missing fillValue XML instead of reference type", () => {
    const xmlString = '<xr:FillValue xsi:type="v8:TypeDescription"/>'
    const { expectedResult, result } = testExportPropertyModelThroughYAMLToXML({
      rule: StandardAttributeDescriptionRules.properties.fillValue,
      value: undefined,
      yaml: undefined,
      xmlRootTag: "xr:FillValue",
      xmlString,
    })

    expect(expectedResult).toBe('<xr:FillValue xsi:type="v8:TypeDescription"/>')
    expect(result).toBe('<xr:FillValue xsi:nil="true"/>')
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

  it("uses canonical FillValue through changed collection item", () => {
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
    expect(result).toContain('<xr:FillValue xsi:nil="true"/>')
    expect(result).not.toContain('xsi:type="v8:TypeDescription"')
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
    expect(Array.from(result.matchAll(/<xr:StandardAttribute name="([^"]+)"/g), ([, name]) => name)).toEqual([
      "PeriodAdjustment",
      "Account",
      "Active",
      "LineNumber",
      "Recorder",
      "Period",
      "ExtDimension1",
      "ExtDimensionType4",
    ])
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

    expect(result).toContain('<xr:StandardAttribute name="ExtDimension50">')
    expect(result).toContain('<xr:StandardAttribute name="ExtDimensionType50">')
    expect(result).not.toContain('name="ExtDimension1"')
  })

  it("восстанавливает sparse accounting attributes только по YAML и rules", () => {
    const itemRule = {
      itemType: "TestItem",
      properties: {
        standardAttributes: {
          type: "StandardAttributeDescriptions",
          yaml: "СтандартныеРеквизиты",
          xml: "StandardAttributes",
          standartAttributeNames: MetadataAccountingRegisterStandardAttributeNames,
          standartAttributeNamesXML: MetadataAccountingRegisterStandardAttributeNamesXML,
        },
      },
    } as const satisfies MetadataItemRule
    const sourceXML = {
      StandardAttributes: {
        "xr:StandardAttribute": [
          {
            _name: "ExtDimension1",
            "xr:LinkByType": {
              "xr:DataPath": "AccountingRegister.Test.StandardAttribute.Account",
              "xr:LinkItem": 1,
            },
            "xr:FillChecking": "DontCheck",
            "xr:MultiLine": false,
            "xr:FillValue": { "_xsi:nil": true },
          },
          {
            _name: "ExtDimensionType1",
            "xr:LinkByType": "",
            "xr:FillChecking": "DontCheck",
            "xr:MultiLine": false,
            "xr:FillValue": { "_xsi:nil": true },
          },
        ],
      },
    }
    const contexts = createDirectRoundTripContexts()

    const imported = testPropertyFromXMLToYAML({
      context: contexts.importContext,
      rule: itemRule,
      xml: sourceXML,
    })
    expect(imported.yaml).toMatchObject({
      СтандартныеРеквизиты: {
        Субконто1: {},
        ВидСубконто1: {},
      },
    })
    const exported = testPropertyFromYAMLToXML({
      context: contexts.exportContext(),
      rule: itemRule,
      yaml: imported.yaml,
    })

    const items = standardAttributeItems(exported.xml)
    expect(items.map((item) => item._name)).toEqual([
      "PeriodAdjustment",
      "Account",
      "Active",
      "LineNumber",
      "Recorder",
      "Period",
      "ExtDimension1",
      "ExtDimensionType1",
    ])
    expect(items.find((item) => item._name === "ExtDimension1")?.["xr:LinkByType"]).toEqual(
      sourceXML.StandardAttributes["xr:StandardAttribute"][0]["xr:LinkByType"]
    )
    expect(items.find((item) => item._name === "ExtDimension1")).toMatchObject({
      "xr:ChoiceHistoryOnInput": "Auto",
      "xr:FullTextSearch": "Use",
      "xr:TypeReductionMode": "TransformValues",
    })
  })

  it("восстанавливает дефолтную коллекцию из пустого !xml", () => {
    const itemRule = standardAttributesOwnerRule("DefaultStandardAttributesProbe", {
      LineNumber: "НомерСтроки",
    })
    const sourceXML = {
      StandardAttributes: {
        "xr:StandardAttribute": {
          _name: "LineNumber",
        },
      },
    }
    const { exported, imported } = roundTripStandardAttributes(itemRule, sourceXML)

    expect(imported.yaml).toEqual({ СтандартныеРеквизиты: EMPTY_XML_TAG_VALUE })
    expect(serializeYAMLDocument(imported.yaml).text).toBe("СтандартныеРеквизиты: !xml")
    const items = standardAttributeItems(exported.xml)
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      _name: "LineNumber",
      "xr:FillChecking": "DontCheck",
      "xr:MultiLine": false,
      "xr:FillValue": { "_xsi:nil": true },
    })
  })

  it("отклоняет непустой payload маркера коллекции", () => {
    const itemRule = standardAttributesOwnerRule("StandardAttributesPayloadProbe", {
      LineNumber: "НомерСтроки",
    })

    expect(() =>
      testPropertyFromYAMLToXML({
        rule: itemRule,
        yaml: importFromYAML("СтандартныеРеквизиты: !xml payload\n"),
      })
    ).toThrow("СтандартныеРеквизиты допускает только пустой !xml")
  })

  it("отклоняет маркер владельца без канонических имён", () => {
    const itemRule = standardAttributesOwnerRule("StandardAttributesWithoutNamesProbe", {})

    expect(() =>
      testPropertyFromYAMLToXML({
        rule: itemRule,
        yaml: importFromYAML("СтандартныеРеквизиты: !xml\n"),
      })
    ).toThrow("Для свойства СтандартныеРеквизиты не определены канонические стандартные реквизиты")
  })

  it("preserves an empty synonym without restoring the standard attribute name", () => {
    const itemRule = {
      itemType: "TestItem",
      properties: {
        standardAttributes: {
          type: "StandardAttributeDescriptions",
          yaml: "СтандартныеРеквизиты",
          xml: "StandardAttributes",
          standartAttributeNames: {
            PeriodAdjustment: "КорректировкаПериода",
            Recorder: "Регистратор",
          },
        },
      },
    } as const satisfies MetadataItemRule
    const sourceXML = {
      StandardAttributes: {
        "xr:StandardAttribute": [
          { _name: "PeriodAdjustment", "xr:Synonym": {} },
          {
            _name: "Recorder",
            "xr:Synonym": {
              "v8:item": [{ "v8:lang": "ru", "v8:content": "Recorder" }],
            },
            "xr:Comment": "keep",
          },
        ],
      },
    }
    const { contexts, exported } = roundTripStandardAttributes(itemRule, sourceXML)
    const fragment = contexts.importContext.fromXML.configurationIndex?.collector.fragment("Тест.yaml")
    expect(fragment?.entities.flatMap((entity) => Object.keys(entity))).not.toContain("present")
    expect(JSON.stringify(fragment?.entities)).not.toMatch(/"(aliases|excludedEqualName|userSettingsId|order)"/)
    const items = standardAttributeItems(exported.xml)
    expect(items.find((item) => item._name === "PeriodAdjustment")?.["xr:Synonym"]).toBe("")
    expect(items.find((item) => item._name === "Recorder")?.["xr:Synonym"]).toEqual({
      "v8:item": [{
        "v8:lang": "ru",
        "v8:content": "Recorder",
      }],
    })
  })

  it("строит sparse standard attributes в каноническом порядке", () => {
    const itemRule = standardAttributesOwnerRule("AccountingRegisterOrderProbe", {
      PeriodAdjustment: "УточнениеПериода",
      Account: "Счет",
      Active: "Активность",
      LineNumber: "НомерСтроки",
      Recorder: "Регистратор",
      Period: "Период",
    })
    const names = ["Account", "RecordType", "Active", "LineNumber", "Recorder", "Period"]
    const sourceXML = {
      StandardAttributes: {
        "xr:StandardAttribute": names.map((name) => ({ _name: name })),
      },
    }
    const { exported } = roundTripStandardAttributes(itemRule, sourceXML)
    const items = standardAttributeItems(exported.xml)

    expect(items.map((item) => item._name)).toEqual([
      "PeriodAdjustment",
      "Account",
      "Active",
      "LineNumber",
      "Recorder",
      "Period",
      "RecordType",
    ])
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

  it("независимо сохраняет дефолтную коллекцию соседних табличных частей", () => {
    const fixture = readAndParseXMLFixture<{
      StandardAttributes: { "xr:StandardAttribute": Array<Record<string, unknown>> }
    }>(import.meta.url, "all.xml")
    const defaultLineNumber = {
      ...fixture.StandardAttributes["xr:StandardAttribute"][0],
      _name: "LineNumber",
    }
    const sourceXML = {
      TabularSections: {
        Item: [
          {
            Name: "СНомеромСтроки",
            StandardAttributes: { "xr:StandardAttribute": [defaultLineNumber] },
          },
          { Name: "БезНомераСтроки" },
        ],
      },
    }

    const imported = testMetadataItemFromXMLToYAML({
      rule: tabularSectionsOwnerRule,
      xml: sourceXML,
    })
    const exported = testMetadataItemFromYAMLToXML({
      rule: tabularSectionsOwnerRule,
      yaml: imported.yaml,
    })
    const sections = (imported.yaml as {
      ТабличныеЧасти: Record<string, Record<string, unknown>>
    }).ТабличныеЧасти

    expect(sections.СНомеромСтроки?.СтандартныеРеквизиты).toBe(EMPTY_XML_TAG_VALUE)
    expect(sections.БезНомераСтроки).not.toHaveProperty("СтандартныеРеквизиты")
    expect(canonicalXML(serializeDirectXML(exported.xml))).toEqual(
      canonicalXML(serializeDirectXML(sourceXML))
    )
  })
})
