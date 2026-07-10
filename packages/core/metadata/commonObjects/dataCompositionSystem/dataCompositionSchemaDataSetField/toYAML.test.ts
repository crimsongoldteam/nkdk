import { describe, expect, it } from "vitest"
import { testExportPropertyToYAML } from "../../../../tests/property/exportPropertyToYAML"
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
    const result = testExportPropertyToYAML({
      rule: { type: "DataCompositionSchemaDataSetField", yaml: "ПолеНабораДанныхСхемыКомпоновкиДанных" },
      value: fullDataCompositionSchemaDataSetField,
    })

    expect(result).toEqual({
      ПолеНабораДанныхСхемыКомпоновкиДанных: fullDataCompositionSchemaDataSetFieldYAML,
    })
  })

  it("exports available values", () => {
    const result = testExportPropertyToYAML({
      rule: { type: "DataCompositionSchemaDataSetField", yaml: "ПолеНабораДанныхСхемыКомпоновкиДанных" },
      value: availableValuesDataCompositionSchemaDataSetField,
    })

    expect(result).toEqual({
      ПолеНабораДанныхСхемыКомпоновкиДанных: availableValuesDataCompositionSchemaDataSetFieldYAML,
    })
  })

  it("exports nested data set kind", () => {
    const result = testExportPropertyToYAML({
      rule: { type: "DataCompositionSchemaDataSetField", yaml: "ПолеНабораДанныхСхемыКомпоновкиДанных" },
      value: nestedDataCompositionSchemaDataSetField,
    })

    expect(result).toEqual({
      ПолеНабораДанныхСхемыКомпоновкиДанных: nestedDataCompositionSchemaDataSetFieldYAML,
    })
  })

  it("exports folder kind", () => {
    const result = testExportPropertyToYAML({
      rule: { type: "DataCompositionSchemaDataSetField", yaml: "ПолеНабораДанныхСхемыКомпоновкиДанных" },
      value: folderDataCompositionSchemaDataSetField,
    })

    expect(result).toEqual({
      ПолеНабораДанныхСхемыКомпоновкиДанных: folderDataCompositionSchemaDataSetFieldYAML,
    })
  })

  it("exports attribute use restriction", () => {
    const result = testExportPropertyToYAML({
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
