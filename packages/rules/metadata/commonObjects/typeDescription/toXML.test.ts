import { importContentFromXML,xmlExport } from "@nkdk/runtime"
import { describe,expect,it } from "vitest"
import { mockContext,mockContextFromXML,mockContextToXML,mockRule } from "../../../tests/mockContext"
import { typeFixturesTable } from "./__fixtures__/data"
import { importTypeDescriptionFromXML } from "./fromXML"
import { exportTypeDescriptionToXML } from "./toXML"
import { TypeDescription,TypeDescriptionXML } from "./types"

const exportTypeDescriptionAtRuntimeBoundary: (
  ...args: [...Parameters<typeof exportTypeDescriptionToXML>, unknown?]
) => ReturnType<typeof exportTypeDescriptionToXML> = exportTypeDescriptionToXML

const typeDescriptionRule = { type: "TypeDescription" } as const
const typeDescriptionRuleWithLocalNamespace = {
  type: "TypeDescription",
  declareTypeNamespaceXML: true,
} as const
const typeDescriptionRuleWithDcssetNamespace = {
  type: "TypeDescription",
  declareTypeNamespaceXML: ["dcsset"],
} as const

const contextWithTypeNamePolicy = (xmlName: "AnyRef" | "AnyIBRef") => {
  const context = mockContextToXML()
  return {
    ...context,
    exportToXML: {
      ...context.exportToXML,
      typeDescriptionXMLNameByType: { AnyIBRef: xmlName },
    },
  }
}

describe("exportTypeDescriptionToXML", () => {
  it("применяет подготовленный префикс только к объявленному пространству имён", () => {
    const base = mockContextToXML()
    const context = { ...base, exportToXML: {
      ...base.exportToXML,
      typeDescriptionXMLPrefixByNamespace: { "http://v8.1c.ru/8.1/data/enterprise/current-config": "d8p1" },
    } }
    const value: TypeDescription = { type: ["CatalogRef.Товары", "AnyIBRef", "boolean"] }
    const declared = exportTypeDescriptionAtRuntimeBoundary(context, typeDescriptionRuleWithLocalNamespace, value)
    expect(declared).toMatchObject({
      "v8:Type": [{ "_xmlns:d8p1": "http://v8.1c.ru/8.1/data/enterprise/current-config", "#text": "d8p1:CatalogRef.Товары" }, "xs:boolean"],
      "v8:TypeSet": { "_xmlns:d8p1": "http://v8.1c.ru/8.1/data/enterprise/current-config", "#text": "d8p1:AnyIBRef" },
    })
    expect(exportTypeDescriptionAtRuntimeBoundary(context, typeDescriptionRule, value)).toMatchObject({
      "v8:Type": ["cfg:CatalogRef.Товары", "xs:boolean"], "v8:TypeSet": "cfg:AnyIBRef",
    })
    const reference = { "v8:Type": { "_xmlns:old": "http://v8.1c.ru/8.1/data/enterprise/current-config", "#text": "old:CatalogRef.Товары" } }
    expect(exportTypeDescriptionAtRuntimeBoundary(context, typeDescriptionRuleWithLocalNamespace, { type: ["CatalogRef.Товары"] }, reference)).toEqual({
      "v8:Type": { "_xmlns:d8p1": "http://v8.1c.ru/8.1/data/enterprise/current-config", "#text": "d8p1:CatalogRef.Товары" },
    })
  })

  it("should export undefined type description to XML", () => {
    const result = exportTypeDescriptionAtRuntimeBoundary(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it.each(typeFixturesTable)("should export type to XML: $internal.type", ({ internal, xml }) => {
    const resultXml = exportTypeDescriptionAtRuntimeBoundary(mockContext, mockRule, internal)

    const result = xmlExport({ TypeDescription: resultXml }, false)

    expect(result).toEqual(xml)
  })

  it.each([
    ["AnyRef", "cfg:AnyRef"],
    ["AnyIBRef", "cfg:AnyIBRef"],
  ] as const)("exports AnyIBRef through %s policy", (xmlName, expected) => {
    expect(
      exportTypeDescriptionAtRuntimeBoundary(contextWithTypeNamePolicy(xmlName), mockRule, { type: ["AnyIBRef"] })
    ).toEqual({ "v8:TypeSet": expected })
  })

  it("gives the XML name policy priority over the reference spelling", () => {
    const reference: TypeDescription = { type: ["AnyIBRef"] }
    Object.defineProperty(reference, Symbol("obsolete XML spelling"), {
      value: { AnyIBRef: { value: "cfg:AnyRef" } },
    })

    expect(
      exportTypeDescriptionAtRuntimeBoundary(
        contextWithTypeNamePolicy("AnyIBRef"),
        mockRule,
        { type: ["AnyIBRef"] },
        reference
      )
    ).toEqual({ "v8:TypeSet": "cfg:AnyIBRef" })
  })

  it.each([
    ["ConstantValueManager.ИспользоватьНачислениеЗарплаты", "cfg:ConstantValueManager.ИспользоватьНачислениеЗарплаты"],
    ["AccumulationRegisterRecordSet.РасчетыСКлиентами", "cfg:AccumulationRegisterRecordSet.РасчетыСКлиентами"],
    ["SequenceRecordSet.ДокументыОрганизаций", "cfg:SequenceRecordSet.ДокументыОрганизаций"],
    ["CatalogManager", "cfg:CatalogManager"],
    ["DocumentManager", "cfg:DocumentManager"],
    ["FixedStructure", "v8:FixedStructure"],
    ["FixedArray", "v8:FixedArray"],
    ["FixedMap", "v8:FixedMap"],
    ["Field", "dcscor:Field"],
    ["ComparisonType", "ent:ComparisonType"],
    ["DataCompositionComparisonType", "dcsset:DataCompositionComparisonType"],
  ])("should export generated platform type to XML: %s", (type, xmlType) => {
    const resultXml = exportTypeDescriptionAtRuntimeBoundary(mockContext, mockRule, { type: [type] })

    const result = xmlExport({ TypeDescription: resultXml }, false)

    expect(result).toEqual(`<TypeDescription>\n\t<v8:Type>${xmlType}</v8:Type>\n</TypeDescription>`)
  })

  it.each([
    "ChartOfAccountsObject",
    "InformationRegisterRecordSet",
    "AccountingRegisterRecordSet",
    "AccumulationRegisterRecordSet",
    "CalculationRegisterRecordSet",
    "SequenceRecordSet",
    "RecalculationRecordSet",
    "ConstantValueManager",
  ] as const)("uses TypeSet only for base %s", (type) => {
    expect(exportTypeDescriptionAtRuntimeBoundary(mockContext, mockRule, { type: [type] })).toEqual({
      "v8:TypeSet": `cfg:${type}`,
    })
    expect(exportTypeDescriptionAtRuntimeBoundary(mockContext, mockRule, { type: [`${type}.Объект`] })).toEqual({
      "v8:Type": `cfg:${type}.Объект`,
    })
  })

  it("exports local type namespace when rule requests it", () => {
    const resultXml = exportTypeDescriptionAtRuntimeBoundary(mockContext, typeDescriptionRuleWithLocalNamespace, {
      type: ["SettingsComposer"],
    })

    const result = xmlExport({ TypeDescription: resultXml }, false)

    expect(result).toEqual(
      '<TypeDescription>\n\t<v8:Type xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings">dcsset:SettingsComposer</v8:Type>\n</TypeDescription>'
    )
  })

  it("exports cfg namespace when rule requests local type namespace", () => {
    const resultXml = exportTypeDescriptionAtRuntimeBoundary(mockContext, typeDescriptionRuleWithLocalNamespace, {
      type: ["CatalogRef.ЗначенияХарактеристик"],
    })

    const result = xmlExport({ TypeDescription: resultXml }, false)

    expect(result).toEqual(
      '<TypeDescription>\n\t<v8:Type xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config">cfg:CatalogRef.ЗначенияХарактеристик</v8:Type>\n</TypeDescription>'
    )
  })

  it("объявляет только перечисленный dcsset namespace", () => {
    expect(exportTypeDescriptionAtRuntimeBoundary(mockContext, typeDescriptionRuleWithDcssetNamespace, {
      type: ["SettingsComposer", "CatalogRef.ЗначенияХарактеристик"],
    })).toEqual({
      "v8:Type": [
        {
          "_xmlns:dcsset": "http://v8.1c.ru/8.1/data-composition-system/settings",
          "#text": "dcsset:SettingsComposer",
        },
        "cfg:CatalogRef.ЗначенияХарактеристик",
      ],
    })
  })

  it("does not export local type namespace by default", () => {
    const resultXml = exportTypeDescriptionAtRuntimeBoundary(mockContext, typeDescriptionRule, { type: ["SettingsComposer"] })

    const result = xmlExport({ TypeDescription: resultXml }, false)

    expect(result).toEqual("<TypeDescription>\n\t<v8:Type>dcsset:SettingsComposer</v8:Type>\n</TypeDescription>")
  })

  it("adds the TypeDescription attribute when the property rule requests it", () => {
    const resultXml = exportTypeDescriptionAtRuntimeBoundary(
      mockContext,
      { type: "TypeDescription", addTypeDescriptionAttributeToXML: true },
      { type: ["string"] }
    )

    expect(resultXml).toMatchObject({ "_xsi:type": "v8:TypeDescription" })
  })

  it("should export known system enumeration type to XML with v8 prefix", () => {
    const resultXml = exportTypeDescriptionAtRuntimeBoundary(mockContext, mockRule, { type: ["FillChecking"] })

    const result = xmlExport({ TypeDescription: resultXml }, false)

    expect(result).toEqual("<TypeDescription>\n\t<v8:Type>v8:FillChecking</v8:Type>\n</TypeDescription>")
  })

  it("exports default binary data qualifiers for base64Binary", () => {
    const resultXml = exportTypeDescriptionAtRuntimeBoundary(mockContext, mockRule, { type: ["base64Binary"] })

    expect(xmlExport({ TypeDescription: resultXml }, false)).toEqual(
      "<TypeDescription>\n" +
        "\t<v8:Type>xs:base64Binary</v8:Type>\n" +
        "\t<v8:BinaryDataQualifiers>\n" +
        "\t\t<v8:Length>0</v8:Length>\n" +
        "\t\t<v8:AllowedLength>Variable</v8:AllowedLength>\n" +
        "\t</v8:BinaryDataQualifiers>\n" +
        "</TypeDescription>"
    )
  })

  it("should export ConditionalAppearance type to XML with entext namespace", () => {
    const referenceXml = importContentFromXML<{ Type?: TypeDescriptionXML }>(
      '<Type>\n\t<v8:Type xmlns:d7p1="http://v8.1c.ru/8.3/data/entext">d7p1:ConditionalAppearance</v8:Type>\n</Type>'
    )
    const referenceTypeDescription = importTypeDescriptionFromXML(
      mockContextFromXML(),
      mockRule,
      referenceXml.Type
    )

    const resultXml = exportTypeDescriptionAtRuntimeBoundary(
      mockContext,
      mockRule,
      { type: ["ConditionalAppearance"] },
      referenceTypeDescription
    )

    const result = xmlExport({ Type: resultXml }, false)

    expect(result).toEqual(
      '<Type>\n\t<v8:Type xmlns:d7p1="http://v8.1c.ru/8.3/data/entext">d7p1:ConditionalAppearance</v8:Type>\n</Type>'
    )
  })

  it("выбирает канонический префикс вместо reference", () => {
    const referenceXml = importContentFromXML<{ Type?: TypeDescriptionXML }>(
      '<Type>\n\t<v8:Type xmlns:d7p1="http://v8.1c.ru/8.2/data/chart">d7p1:Chart</v8:Type>\n</Type>'
    )
    const referenceTypeDescription = importTypeDescriptionFromXML(
      mockContextFromXML(),
      mockRule,
      referenceXml.Type
    )

    const resultXml = exportTypeDescriptionAtRuntimeBoundary(mockContext, mockRule, { type: ["Chart"] }, referenceTypeDescription)

    const result = xmlExport({ Type: resultXml }, false)

    expect(result).toEqual(
      '<Type>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/chart">d5p1:Chart</v8:Type>\n</Type>'
    )
  })

  it("не добавляет локальное объявление cfg из reference", () => {
    const referenceXml = importContentFromXML<{ Type?: TypeDescriptionXML }>(
      '<Type>\n\t<v8:Type xmlns:d4p1="http://v8.1c.ru/8.1/data/enterprise/current-config">d4p1:CatalogRef.ЗначенияХарактеристик</v8:Type>\n</Type>'
    )
    const referenceTypeDescription = importTypeDescriptionFromXML(
      mockContextFromXML(),
      mockRule,
      referenceXml.Type
    )

    const resultXml = exportTypeDescriptionAtRuntimeBoundary(
      mockContext,
      mockRule,
      { type: ["CatalogRef.ЗначенияХарактеристик"] },
      referenceTypeDescription
    )

    const result = xmlExport({ Type: resultXml }, false)

    expect(result).toEqual(
      '<Type>\n\t<v8:Type>cfg:CatalogRef.ЗначенияХарактеристик</v8:Type>\n</Type>'
    )
  })

  it("канонически экспортирует все типы при изменении соседнего типа", () => {
    const referenceXml = importContentFromXML<{ Type?: TypeDescriptionXML }>(
      '<Type>\n\t<v8:Type xmlns:d7p1="http://v8.1c.ru/8.2/data/chart">d7p1:Chart</v8:Type>\n\t<v8:Type>xs:string</v8:Type>\n</Type>'
    )
    const referenceTypeDescription = importTypeDescriptionFromXML(
      mockContextFromXML(),
      mockRule,
      referenceXml.Type
    )

    const resultXml = exportTypeDescriptionAtRuntimeBoundary(
      mockContext,
      mockRule,
      { type: ["Chart", "boolean"] },
      referenceTypeDescription
    )

    const result = xmlExport({ Type: resultXml }, false)

    expect(result).toEqual(
      '<Type>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/chart">d5p1:Chart</v8:Type>\n\t<v8:Type>xs:boolean</v8:Type>\n</Type>'
    )
  })

  it("should not reuse reference prefix spelling for changed semantic type", () => {
    const referenceXml = importContentFromXML<{ Type?: TypeDescriptionXML }>(
      '<Type>\n\t<v8:Type xmlns:d7p1="http://v8.1c.ru/8.2/data/chart">d7p1:Chart</v8:Type>\n</Type>'
    )
    const referenceTypeDescription = importTypeDescriptionFromXML(
      mockContextFromXML(),
      mockRule,
      referenceXml.Type
    )

    const resultXml = exportTypeDescriptionAtRuntimeBoundary(
      mockContext,
      typeDescriptionRuleWithLocalNamespace,
      { type: ["Dendrogram"] },
      referenceTypeDescription
    )

    const result = xmlExport({ Type: resultXml }, false)

    expect(result).toEqual(
      '<Type>\n\t<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/chart">d5p1:Dendrogram</v8:Type>\n</Type>'
    )
  })

  it("should throw on unknown non-enumeration type during XML export", () => {
    expect(() => exportTypeDescriptionAtRuntimeBoundary(mockContext, mockRule, { type: ["DefinitelyUnknownType"] })).toThrow(
      "Type DefinitelyUnknownType not found in TypeDescriptionRules"
    )
  })

  it("should throw on dotted system enumeration type during XML export", () => {
    expect(() => exportTypeDescriptionAtRuntimeBoundary(mockContext, mockRule, { type: ["FillChecking.Anything"] })).toThrow(
      "Type FillChecking.Anything not found in TypeDescriptionRules"
    )
  })
})
