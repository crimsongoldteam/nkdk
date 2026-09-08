import {
  parseXmlDocumentWithSaxes,
  yamlScalarTagAt,
} from "@nkdk/runtime"
import "../../../tests/metadataExecutionContext"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { describe,expect,it } from "vitest"
import { testPropertyFromXMLToYAML, testMetadataItemYamlRoundTrip } from "../../../tests/directConversion"
import { mockContextFromXML } from "../../../tests/mockContext"
import { testExportPropertyModelThroughXMLToYAML } from "../../../tests/property/exportPropertyModelThroughXMLToYAML"
import type { PropertyRule } from "../../ruleRuntime"
import { allYAML } from "./__fixtures__/data"
import { StandartAttributeNameToYAML } from "./types"

const rule: PropertyRule = {
  type: "StandardAttributeDescriptions",
  yaml: "СтандартныеРеквизиты",
  standartAttributeNames: StandartAttributeNameToYAML,
}

const allFixtureNames = {
  Owner: "Владелец",
  PredefinedDataName: "ИмяПредопределенныхДанных",
  Code: "Код",
  Description: "Наименование",
  DeletionMark: "ПометкаУдаления",
  Predefined: "Предопределенный",
  Parent: "Родитель",
  Ref: "Ссылка",
  IsFolder: "ЭтоГруппа",
} as const

describe("StandardAttributeDescriptions XML → YAML", () => {
  it("exports all.xml directly to YAML", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule: { ...rule, standartAttributeNames: allFixtureNames },
      value: undefined,
      path: "all.xml",
      xmlRootTag: "StandardAttributes",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual({ СтандартныеРеквизиты: allYAML })
  })

  it("не создаёт маркер для отсутствующей коллекции", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: undefined,
      path: "default.xml",
      xmlRootTag: "StandardAttributes",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual({})
  })

  it("сохраняет отметку стандартной коллекции без отдельного reference-режима", () => {
    const itemRule = {
      itemType: "StandardAttributeReferenceImportProbe",
      properties: {
        standardAttributes: {
          ...rule,
          xml: "StandardAttributes",
        },
      },
    } as const satisfies MetadataItemRule
    const imported = testPropertyFromXMLToYAML({
      context: mockContextFromXML(),
      rule: itemRule,
      xml: {
        StandardAttributes: {
          "xr:StandardAttribute": { _name: "PredefinedDataName" },
        },
      },
    }).yaml as Record<string, unknown>

    expect(yamlScalarTagAt(imported, "СтандартныеРеквизиты")).toBe("xml/standard-attributes")
  })

  it("помечает полностью стандартную присутствующую коллекцию кратким XML-тегом", () => {
    const result = testMetadataItemYamlRoundTrip({
      sourceXML: DEFAULT_LINE_NUMBER_XML,
      rule: {
        itemType: "StandardAttributeSemanticElisionProbe",
        properties: {
          root: { type: "XMLRoot", container: "Root", isFileRoot: true, xmlOnly: true, rootAttributes: {
            "_xmlns:xr": "http://v8.1c.ru/8.3/xcf/readable",
            "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
          } },
          standardAttributes: {
            ...rule,
            xml: "StandardAttributes",
            standartAttributeNames: { LineNumber: "НомерСтроки" },
          },
        },
      } as const satisfies MetadataItemRule,
    })

    expect(result.yamlText).toContain("СтандартныеРеквизиты: !xml/standard-attributes")
    expect(result.yamlText).not.toContain("!xml/raw")
    expect(parseXmlDocumentWithSaxes(result.result).roots[0]!.structuralHash)
      .toBe(parseXmlDocumentWithSaxes(DEFAULT_LINE_NUMBER_XML).roots[0]!.structuralHash)
  })

  it("exports multiple.xml directly to YAML", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule: {
        ...rule,
        standartAttributeNames: {
          PredefinedDataName: "ИмяПредопределенныхДанных",
          Predefined: "Предопределенный",
        },
      },
      value: undefined,
      path: "multiple.xml",
      xmlRootTag: "StandardAttributes",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual({
      СтандартныеРеквизиты: {
        ИмяПредопределенныхДанных: {
          ПроверкаЗаполнения: "ВыдаватьОшибку",
          Синоним: "Какой-то синоним",
        },
        Предопределенный: {
          Синоним: "Другой какой-то синоним",
        },
      },
    })
  })

  it("exports explicit accounting ExtDimension attributes", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule: {
        type: "StandardAttributeDescriptions",
        yaml: "СтандартныеРеквизиты",
        standartAttributeNames: {},
      },
      value: undefined,
      path: "accounting-ext-dimensions.xml",
      xmlRootTag: "StandardAttributes",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual({
      СтандартныеРеквизиты: {
        ExtDimension1: {},
        ExtDimensionType1: {},
        ExtDimension50: {},
        ExtDimensionType50: {},
      },
    })
  })
})

const DEFAULT_LINE_NUMBER_XML = `<Root xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><StandardAttributes><xr:StandardAttribute name="LineNumber">
<xr:LinkByType/><xr:FillChecking>DontCheck</xr:FillChecking><xr:MultiLine>false</xr:MultiLine>
<xr:FillFromFillingValue>false</xr:FillFromFillingValue><xr:CreateOnInput>Auto</xr:CreateOnInput>
<xr:TypeReductionMode>TransformValues</xr:TypeReductionMode><xr:MaxValue xsi:nil="true"/><xr:ToolTip/>
<xr:ExtendedEdit>false</xr:ExtendedEdit><xr:Format/><xr:ChoiceForm/><xr:QuickChoice>Auto</xr:QuickChoice>
<xr:ChoiceHistoryOnInput>Auto</xr:ChoiceHistoryOnInput><xr:EditFormat/><xr:PasswordMode>false</xr:PasswordMode>
<xr:DataHistory>Use</xr:DataHistory><xr:MarkNegatives>false</xr:MarkNegatives><xr:MinValue xsi:nil="true"/>
<xr:Synonym/><xr:Comment/><xr:FullTextSearch>Use</xr:FullTextSearch><xr:ChoiceParameterLinks/>
<xr:FillValue xsi:nil="true"/><xr:Mask/><xr:ChoiceParameters/>
</xr:StandardAttribute></StandardAttributes></Root>`
