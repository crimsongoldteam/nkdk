import { describe, expect, it } from "vitest"
import { testExportPropertyModelThroughXMLToYAML } from "../../../../tests/property/exportPropertyModelThroughXMLToYAML"
import {
  availableValuesDataCompositionSchemaDataSetField,
  availableValuesDataCompositionSchemaDataSetFieldYAML,
  folderDataCompositionSchemaDataSetField,
  folderDataCompositionSchemaDataSetFieldYAML,
  fullDataCompositionSchemaDataSetField,
  fullDataCompositionSchemaDataSetFieldYAML,
  nestedDataCompositionSchemaDataSetField,
  nestedDataCompositionSchemaDataSetFieldYAML,
} from "./__fixtures__/data"
import "./types"

describe("export DataCompositionSchemaDataSetField to YAML", () => {
  it("exports full YAML", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule: { type: "DataCompositionSchemaDataSetField", yaml: "ПолеНабораДанныхСхемыКомпоновкиДанных" },
      value: fullDataCompositionSchemaDataSetField,
      path: "full.xml",
      xmlRootTag: "Field",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual({
      ПолеНабораДанныхСхемыКомпоновкиДанных: fullDataCompositionSchemaDataSetFieldYAML,
    })
  })

  it("exports available values", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule: { type: "DataCompositionSchemaDataSetField", yaml: "ПолеНабораДанныхСхемыКомпоновкиДанных" },
      value: availableValuesDataCompositionSchemaDataSetField,
      path: "availableValues.xml",
      xmlRootTag: "Field",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual({
      ПолеНабораДанныхСхемыКомпоновкиДанных: availableValuesDataCompositionSchemaDataSetFieldYAML,
    })
  })

  it("exports nested data set kind", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule: { type: "DataCompositionSchemaDataSetField", yaml: "ПолеНабораДанныхСхемыКомпоновкиДанных" },
      value: nestedDataCompositionSchemaDataSetField,
      path: "nested-data-set.xml",
      xmlRootTag: "Field",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual({
      ПолеНабораДанныхСхемыКомпоновкиДанных: nestedDataCompositionSchemaDataSetFieldYAML,
    })
  })

  it("exports folder kind", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule: { type: "DataCompositionSchemaDataSetField", yaml: "ПолеНабораДанныхСхемыКомпоновкиДанных" },
      value: folderDataCompositionSchemaDataSetField,
      path: "folder.xml",
      xmlRootTag: "Field",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual({
      ПолеНабораДанныхСхемыКомпоновкиДанных: folderDataCompositionSchemaDataSetFieldYAML,
    })
  })

  it("exports attribute use restriction", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule: { type: "DataCompositionSchemaDataSetField", yaml: "ПолеНабораДанныхСхемыКомпоновкиДанных" },
      value: {
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
      },
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
    })

    expect(result).toEqual({
      ПолеНабораДанныхСхемыКомпоновкиДанных: {
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
    })
  })
})
