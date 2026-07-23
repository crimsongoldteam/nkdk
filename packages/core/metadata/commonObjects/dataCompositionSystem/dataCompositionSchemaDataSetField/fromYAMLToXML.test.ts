import { describe, expect, it } from "vitest"
import { testExportPropertyModelThroughYAMLToXML } from "../../../../tests/property/exportPropertyModelThroughYAMLToXML"
import {
  appearanceDataCompositionSchemaDataSetField,
  directAppearanceFieldsDataCompositionSchemaDataSetField,
  availableValuesDataCompositionSchemaDataSetField,
  folderDataCompositionSchemaDataSetField,
  fullDataCompositionSchemaDataSetField,
  nestedDataCompositionSchemaDataSetField,
  fullDataCompositionSchemaDataSetFieldYAML,
  availableValuesDataCompositionSchemaDataSetFieldYAML,
  nestedDataCompositionSchemaDataSetFieldYAML,
  folderDataCompositionSchemaDataSetFieldYAML,
  legacyDataCompositionSchemaDataSetFieldYAML,
} from "./__fixtures__/data"
import { explicitYAMLString } from "../../../../yaml/explicitString"
import "./types"

describe("export DataCompositionSchemaDataSetField to XML", () => {
  it("exports full.xml", () => {
    const { result, expectedResult } = testExportPropertyModelThroughYAMLToXML({
      rule: { type: "DataCompositionSchemaDataSetField" },
      value: fullDataCompositionSchemaDataSetField,
      yaml: fullDataCompositionSchemaDataSetFieldYAML,
      xmlRootTag: "Field",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports availableValues.xml", () => {
    const { result, expectedResult } = testExportPropertyModelThroughYAMLToXML({
      rule: { type: "DataCompositionSchemaDataSetField" },
      value: availableValuesDataCompositionSchemaDataSetField,
      yaml: availableValuesDataCompositionSchemaDataSetFieldYAML,
      xmlRootTag: "Field",
      path: "availableValues.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports appearance.xml", () => {
    const { result, expectedResult } = testExportPropertyModelThroughYAMLToXML({
      rule: { type: "DataCompositionSchemaDataSetField" },
      value: appearanceDataCompositionSchemaDataSetField,
      yaml: {
        Вид: "ПолеНабораДанныхСхемыКомпоновкиДанных",
        ПутьКДанным: "Сумма",
        Поле: "Сумма",
        Оформление: {
          Формат: { Значение: explicitYAMLString("ЧЦ=15; ЧДЦ=2") },
        },
      },
      xmlRootTag: "Field",
      path: "appearance.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports appearance-direct-fields.xml", () => {
    const { result, expectedResult } = testExportPropertyModelThroughYAMLToXML({
      rule: { type: "DataCompositionSchemaDataSetField" },
      value: directAppearanceFieldsDataCompositionSchemaDataSetField,
      yaml: {
        Вид: "ПолеНабораДанныхСхемыКомпоновкиДанных",
        ПутьКДанным: "Сумма",
        Поле: "Сумма",
        Оформление: {
          Формат: { Значение: explicitYAMLString("ЧЦ=15; ЧДЦ=2") },
          ЦветТекста: { Значение: "Синий" },
        },
      },
      xmlRootTag: "Field",
      path: "appearance-direct-fields.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports legacy YAML without kind as field kind", () => {
    const { result, expectedResult } = testExportPropertyModelThroughYAMLToXML({
      rule: { type: "DataCompositionSchemaDataSetField" },
      value: fullDataCompositionSchemaDataSetField,
      yaml: legacyDataCompositionSchemaDataSetFieldYAML,
      xmlRootTag: "Field",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports attribute use restriction", () => {
    const xmlString = `<Field xsi:type="dcssch:DataSetFieldField">
	<dcssch:dataPath>МЧД</dcssch:dataPath>
	<dcssch:field>МЧД</dcssch:field>
	<dcssch:attributeUseRestriction>
		<dcssch:field>true</dcssch:field>
		<dcssch:condition>true</dcssch:condition>
		<dcssch:group>true</dcssch:group>
		<dcssch:order>true</dcssch:order>
	</dcssch:attributeUseRestriction>
</Field>`
    const { result, expectedResult } = testExportPropertyModelThroughYAMLToXML({
      rule: { type: "DataCompositionSchemaDataSetField" },
      value: undefined,
      yaml: {
        Вид: "ПолеНабораДанныхСхемыКомпоновкиДанных",
        ПутьКДанным: "МЧД",
        Поле: "МЧД",
        ОграничениеИспользованияРеквизитов: {
          Поле: "Истина",
          Условие: "Истина",
          Группировка: "Истина",
          Порядок: "Истина",
        },
      },
      xmlRootTag: "Field",
      xmlString,
    })

    expect(result).toEqual(expectedResult)
  })

  it("preserves xs:string title in XML", () => {
    const xmlString = `<Field xsi:type="dcssch:DataSetFieldField">
	<dcssch:dataPath>StringTitleField</dcssch:dataPath>
	<dcssch:field>StringTitleField</dcssch:field>
	<dcssch:title xsi:type="xs:string">String title</dcssch:title>
</Field>`
    const { result, expectedResult } = testExportPropertyModelThroughYAMLToXML({
      rule: { type: "DataCompositionSchemaDataSetField" },
      value: undefined,
      yaml: {
        Вид: "ПолеНабораДанныхСхемыКомпоновкиДанных",
        ПутьКДанным: "StringTitleField",
        Поле: "StringTitleField",
        Заголовок: "String title",
      },
      xmlRootTag: "Field",
      xmlString,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports nested-data-set.xml", () => {
    const { result, expectedResult } = testExportPropertyModelThroughYAMLToXML({
      rule: { type: "DataCompositionSchemaDataSetField" },
      value: nestedDataCompositionSchemaDataSetField,
      yaml: nestedDataCompositionSchemaDataSetFieldYAML,
      xmlRootTag: "Field",
      path: "nested-data-set.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports folder.xml", () => {
    const { result, expectedResult } = testExportPropertyModelThroughYAMLToXML({
      rule: { type: "DataCompositionSchemaDataSetField" },
      value: folderDataCompositionSchemaDataSetField,
      yaml: folderDataCompositionSchemaDataSetFieldYAML,
      xmlRootTag: "Field",
      path: "folder.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
