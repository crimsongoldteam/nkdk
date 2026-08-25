import { describe,expect,it } from "vitest"
import { testExportPropertyModelThroughYAMLToXML } from "../../../../tests/property/exportPropertyModelThroughYAMLToXML"
import {
availableValuesDataCompositionSchemaDataSetField,
availableValuesDataCompositionSchemaDataSetFieldYAML,
folderDataCompositionSchemaDataSetField,
folderDataCompositionSchemaDataSetFieldYAML,
fullDataCompositionSchemaDataSetField,
fullDataCompositionSchemaDataSetFieldYAML,
legacyDataCompositionSchemaDataSetFieldYAML,
nestedDataCompositionSchemaDataSetField,
nestedDataCompositionSchemaDataSetFieldYAML,
} from "./__fixtures__/data"
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

  it("exports appearance-collection.xml", () => {
    const { result, expectedResult } = testExportPropertyModelThroughYAMLToXML({
      rule: { type: "DataCompositionSchemaDataSetField" },
      value: undefined,
      yaml: {
        Вид: "ПолеНабораДанныхСхемыКомпоновкиДанных",
        ПутьКДанным: "ВремяВыполнения",
        Поле: "ВремяВыполнения",
        ТипЗначения: "Число(15, 3)",
        Оформление: {
          Формат: "ЧЦ=15; ЧДЦ=3; ЧН=0,000",
        },
      },
      xmlRootTag: "Field",
      path: "appearance-collection.xml",
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
