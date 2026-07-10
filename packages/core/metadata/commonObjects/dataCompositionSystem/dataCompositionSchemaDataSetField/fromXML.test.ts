import { describe, expect, it } from "vitest"
import { exportPropertyToXML, PropertyRule } from "../../../orchestration"
import { mockContextToXML } from "../../../../tests/mockContext"
import { testExportPropertyToXML } from "../../../../tests/property/exportPropertyToXML"
import { testImportPropertyFromXML } from "../../../../tests/property/importPropertyFromXML"
import { xmlExport } from "../../../../xml/export/exporter"
import {
  appearanceDataCompositionSchemaDataSetField,
  availableValuesDataCompositionSchemaDataSetField,
  directAppearanceFieldsDataCompositionSchemaDataSetField,
  folderDataCompositionSchemaDataSetField,
  fullDataCompositionSchemaDataSetField,
  nestedDataCompositionSchemaDataSetField,
} from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = { type: "DataCompositionSchemaDataSetField" }

const xmlWithStringTitle = `<Field xsi:type="dcssch:DataSetFieldField">
	<dcssch:dataPath>StringTitleField</dcssch:dataPath>
	<dcssch:field>StringTitleField</dcssch:field>
	<dcssch:title xsi:type="xs:string">String title</dcssch:title>
</Field>`

const xmlWithAttributeUseRestriction = `<Field xsi:type="dcssch:DataSetFieldField">
	<dcssch:dataPath>МЧД</dcssch:dataPath>
	<dcssch:field>МЧД</dcssch:field>
	<dcssch:attributeUseRestriction>
		<dcssch:field>true</dcssch:field>
		<dcssch:condition>true</dcssch:condition>
		<dcssch:group>true</dcssch:group>
		<dcssch:order>true</dcssch:order>
	</dcssch:attributeUseRestriction>
</Field>`

const exportDataCompositionSchemaDataSetField = (value: unknown, referenceMetadata?: unknown): string => {
  const xmlData = exportPropertyToXML({
    context: mockContextToXML(),
    rule,
    value,
    referenceMetadata,
  })

  return xmlExport({ Field: xmlData }, false)
}

describe("import DataCompositionSchemaDataSetField from XML", () => {
  it("round-trips full.xml", () => {
    const imported = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag: "Field",
      importMetaUrl: import.meta.url,
    })

    const { result, expectedResult } = testExportPropertyToXML({
      rule,
      value: imported,
      xmlRootTag: "Field",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("imports full.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag: "Field",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(fullDataCompositionSchemaDataSetField)
  })

  it("imports available values", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "availableValues.xml",
      xmlRootTag: "Field",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(availableValuesDataCompositionSchemaDataSetField)
  })

  it("round-trips availableValues.xml", () => {
    const imported = testImportPropertyFromXML({
      rule,
      path: "availableValues.xml",
      xmlRootTag: "Field",
      importMetaUrl: import.meta.url,
    })

    const { result, expectedResult } = testExportPropertyToXML({
      rule,
      value: imported,
      xmlRootTag: "Field",
      path: "availableValues.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("imports appearance.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "appearance.xml",
      xmlRootTag: "Field",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(appearanceDataCompositionSchemaDataSetField)
  })

  it("round-trips appearance.xml", () => {
    const imported = testImportPropertyFromXML({
      rule,
      path: "appearance.xml",
      xmlRootTag: "Field",
      importMetaUrl: import.meta.url,
    })

    const { result, expectedResult } = testExportPropertyToXML({
      rule,
      value: imported,
      xmlRootTag: "Field",
      path: "appearance.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("round-trips appearance direct fields", () => {
    const imported = testImportPropertyFromXML({
      rule,
      path: "appearance-direct-fields.xml",
      xmlRootTag: "Field",
      importMetaUrl: import.meta.url,
    })

    expect(imported).toEqual(directAppearanceFieldsDataCompositionSchemaDataSetField)

    const { result, expectedResult } = testExportPropertyToXML({
      rule,
      value: imported,
      xmlRootTag: "Field",
      path: "appearance-direct-fields.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toContain(`<dcsset:value xsi:type="xs:string">ЧЦ=15; ЧДЦ=2</dcsset:value>`)
    expect(result).toContain(`<dcsset:textColor>`)
    expect(result).toEqual(expectedResult)
  })

  it("round-trips nested-data-set.xml", () => {
    const imported = testImportPropertyFromXML({
      rule,
      path: "nested-data-set.xml",
      xmlRootTag: "Field",
      importMetaUrl: import.meta.url,
    })

    const { result, expectedResult } = testExportPropertyToXML({
      rule,
      value: imported,
      xmlRootTag: "Field",
      path: "nested-data-set.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("imports nested data set kind", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "nested-data-set.xml",
      xmlRootTag: "Field",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(nestedDataCompositionSchemaDataSetField)
  })

  it("round-trips folder.xml", () => {
    const imported = testImportPropertyFromXML({
      rule,
      path: "folder.xml",
      xmlRootTag: "Field",
      importMetaUrl: import.meta.url,
    })

    const { result, expectedResult } = testExportPropertyToXML({
      rule,
      value: imported,
      xmlRootTag: "Field",
      path: "folder.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("imports folder kind", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "folder.xml",
      xmlRootTag: "Field",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(folderDataCompositionSchemaDataSetField)
  })

  it("imports and exports xs:string title", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlString: xmlWithStringTitle,
      xmlRootTag: "Field",
    })
    const referenceMetadata = testImportPropertyFromXML({
      rule,
      xmlString: xmlWithStringTitle,
      xmlRootTag: "Field",
      forReference: true,
    })

    expect(result).toEqual({
      itemType: "DataCompositionSchemaDataSetField",
      kind: "ПолеНабораДанныхСхемыКомпоновкиДанных",
      dataPath: "StringTitleField",
      field: "StringTitleField",
      title: { items: { ru: "String title" } },
    })

    const exported = exportDataCompositionSchemaDataSetField(result, referenceMetadata)
    expect(exported).toContain(`<dcssch:title xsi:type="xs:string">String title</dcssch:title>`)
    expect(exported).not.toContain(`<dcssch:title xsi:type="v8:LocalStringType">`)
  })

  it("round-trips attributeUseRestriction", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlString: xmlWithAttributeUseRestriction,
      xmlRootTag: "Field",
    })

    expect(result).toEqual({
      itemType: "DataCompositionSchemaDataSetField",
      kind: "ПолеНабораДанныхСхемыКомпоновкиДанных",
      dataPath: "МЧД",
      field: "МЧД",
      attributeUseRestriction: {
        itemType: "CalculatedFieldUseRestriction",
        field: true,
        condition: true,
        group: true,
        order: true,
      },
    })

    const exported = exportDataCompositionSchemaDataSetField(result)

    expect(exported).toEqual(xmlWithAttributeUseRestriction)
  })
})
