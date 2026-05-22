import { describe, expect, it } from "vitest"
import {
  choiceListFormAttribute,
  fullFormAttributes,
  minimalFormAttributes,
  multipleFormAttributes,
  tableWithColumnsFormAttribute,
  treeWithColumnFormAttribute,
  withAdditionalColumnFormAttribute,
  withEmptySettingsFormAttribute,
  withoutTypeFormAttribute,
} from "~/tests/fixtures/formAttributes/data"
import { mockContextFromXML, mockContextToXML, mockRule } from "~/tests/mockContext"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { setIdsToElements } from "../../clientApplicationForm/toXML"
import { attributeAnyType } from "./__fixtures__/attributeAnyType"
import { chartSettings } from "./__fixtures__/chartSettings"
import { columnAnyType } from "./__fixtures__/columnAnyType"
import { ganttChartSettings } from "./__fixtures__/ganttChartSettings"
import { mixedColumns } from "./__fixtures__/mixedColumns"
import { plannerSettings } from "./__fixtures__/plannerSettings"
import { plannerSettingsWithNil } from "./__fixtures__/plannerSettingsWithNil"
import { spreadsheetDocumentSettings } from "./__fixtures__/spreadsheetDocumentSettings"
import { tableWithColumns } from "./__fixtures__/tableWithColumns"
import { titleColumnsType } from "./__fixtures__/titleColumnsType"
import { treeWithColumn } from "./__fixtures__/treeWithColumn"
import { twoTables } from "./__fixtures__/twoTables"
import { valueListWithReferenceEmptySettings } from "./__fixtures__/valueListWithReferenceEmptySettings"
import { valueListWithoutSettings } from "./__fixtures__/valueListWithoutSettings"
import { importFormAttributesFromXML } from "./fromXML"
import { exportFormAttributesToXML } from "./toXML"

const formAttributesRule = { type: "FormAttributes", xml: "Attribute" } as const
const erpDuplicateAdditionalColumnsFormPath =
  "Catalogs/СпособыОтраженияРасходовПоАмортизацииМСФО/Forms/ФормаСписка/Ext/Form.xml"

const formAttributesWithCanonicalErpAdditionalColumn: FormAttributes = [
  {
    itemType: "FormAttribute",
    name: "Объект",
    title: { items: { ru: "" } },
    type: { type: ["string"] },
    columns: [],
    additionalColumns: [
      {
        table: "Список.Способы",
        columns: [
          {
            itemType: "FormAttributeColumn",
            name: "Реквизит1",
            title: { items: { ru: "Реквизит1" } },
            type: { type: ["string"] },
          },
        ],
      },
    ],
  },
]

const referenceWithoutValueType = (path: string): unknown => {
  const reference = testImportPropertyFromXML({
    rule: formAttributesRule,
    path,
    importMetaUrl: import.meta.url,
    forReference: true,
  })

  if (!Array.isArray(reference)) return reference

  for (const attribute of reference) {
    if (attribute !== null && typeof attribute === "object") {
      delete (attribute as Record<string, unknown>).valueType
    }
  }

  return reference
}

describe("exportFormAttributesToXML", () => {
  it("should export undefined when data is undefined", () => {
    const result = exportFormAttributesToXML(mockContextToXML(), mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const expectedResult = readXMLFileAsString("formAttributes/full.xml")

    const context = mockContextToXML()
    const xmlData = exportFormAttributesToXML(context, mockRule, fullFormAttributes)

    setIdsToElements(context)

    const result = xmlExport(xmlData!, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export defaults", () => {
    const expectedResult = readXMLFileAsString("formAttributes/minimal.xml")

    const context = mockContextToXML()
    const xmlData = exportFormAttributesToXML(context, mockRule, minimalFormAttributes)

    setIdsToElements(context)

    const result = xmlExport(xmlData!, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export multiple attributes", () => {
    const expectedResult = readXMLFileAsString("formAttributes/multiple.xml")
    const context = mockContextToXML()

    const xmlData = exportFormAttributesToXML(context, mockRule, multipleFormAttributes)

    setIdsToElements(context)

    const result = xmlExport(xmlData!, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export choice list", () => {
    const expectedResult = readXMLFileAsString("formAttributes/choiceList.xml")

    const context = mockContextToXML()
    const xmlData = exportFormAttributesToXML(context, mockRule, choiceListFormAttribute)

    setIdsToElements(context)

    const result = xmlExport(xmlData!, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export with empty settings", () => {
    const reference = testImportPropertyFromXML({
      rule: formAttributesRule,
      path: "formAttributes/withEmptySettings.xml",
      forReference: true,
    })

    const { result, expectedResult } = testExportPropertyToXML({
      rule: formAttributesRule,
      value: withEmptySettingsFormAttribute,
      referenceMetadata: reference,
      xmlRootTag: "Attribute",
      exportXmlDataAsRoot: true,
      path: "formAttributes/withEmptySettings.xml",
    })

    expect(result).toEqual(expectedResult)
  })

  it("should export without type", () => {
    const expectedResult = readXMLFileAsString("formAttributes/withoutType.xml")

    const context = mockContextToXML()
    const xmlData = exportFormAttributesToXML(context, mockRule, withoutTypeFormAttribute)

    setIdsToElements(context)

    const result = xmlExport(xmlData!, false)

    expect(result).toEqual(expectedResult)
  })

  // it("should export with dynamic list", () => {
  //   const expectedResult = readXMLFileAsString("formAttributes/withDynamicList.xml")

  //   const xmlData = exportFormAttributesToXML(mockContext, mockRule, withDynamicListFormAttribute)

  //   const result = xmlExport(xmlData!, false)

  //   expect(result).toEqual(expectedResult)
  // })

  it("should export table with columns", () => {
    const expectedResult = readXMLFileAsString("formAttributes/tableWithColumns.xml")

    const context = mockContextToXML()
    const xmlData = exportFormAttributesToXML(context, mockRule, tableWithColumnsFormAttribute)

    setIdsToElements(context)

    const result = xmlExport(xmlData!, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export tree with column", () => {
    const expectedResult = readXMLFileAsString("formAttributes/treeWithColumn.xml")

    const context = mockContextToXML()
    const xmlData = exportFormAttributesToXML(context, mockRule, treeWithColumnFormAttribute)

    setIdsToElements(context)

    const result = xmlExport(xmlData!, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export with additional column", () => {
    const expectedResult = readXMLFileAsString("formAttributes/additionalColumn.xml")

    const context = mockContextToXML()
    const xmlData = exportFormAttributesToXML(context, mockRule, withAdditionalColumnFormAttribute)

    setIdsToElements(context)

    const result = xmlExport(xmlData!, false)

    expect(result).toEqual(expectedResult)
  })

  it("restores ERP duplicate AdditionalColumns only for the known form path", () => {
    const context = mockContextToXML()
    context.exportToXML.context!.currentXMLPath = erpDuplicateAdditionalColumnsFormPath

    const xmlData = exportFormAttributesToXML(context, mockRule, formAttributesWithCanonicalErpAdditionalColumn)
    const additionalColumns = xmlData?.Attribute[0]?.Columns?.AdditionalColumns
    const firstAdditionalColumn = Array.isArray(additionalColumns) ? additionalColumns[0] : additionalColumns
    const columns = firstAdditionalColumn?.Column

    expect(columns).toHaveLength(5)
    expect(columns?.map((column) => column._name)).toEqual([
      "Реквизит1",
      "Реквизит1",
      "Реквизит1",
      "Реквизит1",
      "Реквизит1",
    ])
    expect(columns?.map((column) => column._id)).toEqual(["1", "2", "3", "4", "5"])
  })

  it("keeps canonical AdditionalColumns for other form paths", () => {
    const context = mockContextToXML()
    context.exportToXML.context!.currentXMLPath = "Catalogs/ДругойСправочник/Forms/ФормаСписка/Ext/Form.xml"

    const xmlData = exportFormAttributesToXML(context, mockRule, formAttributesWithCanonicalErpAdditionalColumn)
    const additionalColumns = xmlData?.Attribute[0]?.Columns?.AdditionalColumns
    const firstAdditionalColumn = Array.isArray(additionalColumns) ? additionalColumns[0] : additionalColumns
    const columns = firstAdditionalColumn?.Column

    expect(columns).toHaveLength(1)
    expect(columns?.map((column) => column._name)).toEqual(["Реквизит1"])
  })

  it("export tableWithColumns", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: formAttributesRule,
      value: tableWithColumns,
      referenceMetadata: referenceWithoutValueType("tableWithColumns.xml"),
      xmlRootTag: "Attribute",
      exportXmlDataAsRoot: true,
      path: "tableWithColumns.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("export treeWithColumn", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: formAttributesRule,
      value: treeWithColumn,
      referenceMetadata: referenceWithoutValueType("treeWithColumn.xml"),
      xmlRootTag: "Attribute",
      exportXmlDataAsRoot: true,
      path: "treeWithColumn.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("export twoTables", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: formAttributesRule,
      value: twoTables,
      referenceMetadata: referenceWithoutValueType("twoTables.xml"),
      xmlRootTag: "Attribute",
      exportXmlDataAsRoot: true,
      path: "twoTables.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("export mixedColumns", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: formAttributesRule,
      value: mixedColumns,
      referenceMetadata: referenceWithoutValueType("mixedColumns.xml"),
      xmlRootTag: "Attribute",
      exportXmlDataAsRoot: true,
      path: "mixedColumns.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("export titleColumnsType", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: formAttributesRule,
      value: titleColumnsType,
      referenceMetadata: referenceWithoutValueType("titleColumnsType.xml"),
      xmlRootTag: "Attribute",
      exportXmlDataAsRoot: true,
      path: "titleColumnsType.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("round-trip keeps repeated DynamicList KeyField nodes in Settings", () => {
    const context = mockContextToXML()
    const value = importFormAttributesFromXML(
      mockContextFromXML({ forReference: true }),
      mockRule,
      {
        Attribute: [{
          _name: "Список",
          _id: "1",
          Settings: {
            "_xsi:type": "DynamicList",
            KeyType: "RowKey",
            KeyField: ["КлючПриглашения", "Контрагент", "ИдентификаторОрганизации"],
          },
        }],
      }
    )

    const xmlData = exportFormAttributesToXML(context, mockRule, value, value)
    const result = xmlExport(xmlData!, false)

    expect(result.match(/<KeyField>/g)).toHaveLength(3)
    expect(result).toContain("<KeyType>RowKey</KeyType>")
    expect(result).toContain("<KeyField>КлючПриглашения</KeyField>")
    expect(result).toContain("<KeyField>Контрагент</KeyField>")
    expect(result).toContain("<KeyField>ИдентификаторОрганизации</KeyField>")
  })

  it("exports FlowchartContextType Settings", () => {
    const context = mockContextToXML()
    const value = [{
      itemType: "FormAttribute" as const,
      name: "Схема",
      type: { type: ["FlowchartContextType"] },
      title: { items: { ru: "" } },
      columns: [],
      flowchartContext: {
        "d4p1:pointsCurId": "7",
      },
    }]

    const xmlData = exportFormAttributesToXML(context, mockRule, value)
    const result = xmlExport(xmlData!, false)

    expect(result).toContain('xmlns:d4p1="http://v8.1c.ru/8.2/data/graphscheme"')
    expect(result).toContain('xsi:type="d4p1:FlowchartContextType"')
    expect(result).toContain("<d4p1:pointsCurId>7</d4p1:pointsCurId>")
    expect(result).not.toContain('xsi:type="v8:TypeDescription"')
  })

  it("export attributeAnyType", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: formAttributesRule,
      value: attributeAnyType,
      referenceMetadata: referenceWithoutValueType("attributeAnyType.xml"),
      xmlRootTag: "Attribute",
      exportXmlDataAsRoot: true,
      path: "attributeAnyType.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("export columnAnyType", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: formAttributesRule,
      value: columnAnyType,
      referenceMetadata: referenceWithoutValueType("columnAnyType.xml"),
      xmlRootTag: "Attribute",
      exportXmlDataAsRoot: true,
      path: "columnAnyType.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("export chartSettings", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: formAttributesRule,
      value: chartSettings,
      xmlRootTag: "Attribute",
      exportXmlDataAsRoot: true,
      path: "chartSettings.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("export ganttChartSettings", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: formAttributesRule,
      value: ganttChartSettings,
      xmlRootTag: "Attribute",
      exportXmlDataAsRoot: true,
      path: "ganttChartSettings.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("export spreadsheetDocumentSettings", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: formAttributesRule,
      value: spreadsheetDocumentSettings,
      xmlRootTag: "Attribute",
      exportXmlDataAsRoot: true,
      path: "spreadsheetDocumentSettings.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("export plannerSettings", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: formAttributesRule,
      value: plannerSettings,
      xmlRootTag: "Attribute",
      exportXmlDataAsRoot: true,
      path: "plannerSettings.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("export plannerSettingsWithNil", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: formAttributesRule,
      value: plannerSettingsWithNil,
      xmlRootTag: "Attribute",
      exportXmlDataAsRoot: true,
      path: "plannerSettingsWithNil.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports ValueListType without Settings when reference is absent", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: formAttributesRule,
      value: valueListWithoutSettings,
      referenceMetadata: undefined,
      xmlRootTag: "Attribute",
      exportXmlDataAsRoot: true,
      path: "valueListWithoutSettings.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("preserves empty Settings for ValueListType from reference", () => {
    const reference = testImportPropertyFromXML({
      rule: formAttributesRule,
      path: "valueListWithReferenceEmptySettings.xml",
      importMetaUrl: import.meta.url,
      forReference: true,
    })

    const { result, expectedResult } = testExportPropertyToXML({
      rule: formAttributesRule,
      value: valueListWithReferenceEmptySettings,
      referenceMetadata: reference,
      xmlRootTag: "Attribute",
      exportXmlDataAsRoot: true,
      path: "valueListWithReferenceEmptySettings.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
