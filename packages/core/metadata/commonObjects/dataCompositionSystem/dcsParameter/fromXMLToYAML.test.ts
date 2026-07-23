import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
import { testExportPropertyModelThroughXMLToYAML } from "../../../../tests/property/exportPropertyModelThroughXMLToYAML"
import {
  fullDCSParameters,
  fullDCSParametersYAML,
  minimalDCSParameters,
  minimalDCSParametersYAML,
} from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "DCSParameters",
  yaml: "Параметры",
}

describe("export DCSParameter to YAML", () => {
  it("exports undefined", () => {
    const result = testExportPropertyModelThroughXMLToYAML({ rule, value: undefined })
    expect(result).toBeUndefined()
  })

  it("exports minimal collection", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: minimalDCSParameters,
      path: "minimal.xml",
      xmlRootTag: "Settings",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual({ Параметры: minimalDCSParametersYAML })
  })

  it("exports full collection", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: fullDCSParameters,
      path: "full.xml",
      xmlRootTag: "Settings",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual({ Параметры: fullDCSParametersYAML })
  })

  it("exports multiple values", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: [
        {
          itemType: "DCSParameter" as const,
          name: "ТипыНалогообложения",
          value: [
            {
              type: "DesignTimeValue" as const,
              value: "Перечисление.ТипыНалогообложенияНДС.ПродажаНаЭкспорт",
            },
            {
              type: "DesignTimeValue" as const,
              value: "Перечисление.ТипыНалогообложенияНДС.ЭкспортСырьевыхТоваровУслуг",
            },
          ],
        },
      ],
      yaml: {
        ТипыНалогообложения: {
          Значение: [
            "Перечисление.ТипыНалогообложенияНДС.ПродажаНаЭкспорт",
            "Перечисление.ТипыНалогообложенияНДС.ЭкспортСырьевыхТоваровУслуг",
          ],
        },
      },
    })

    expect(result).toEqual({
      Параметры: {
        ТипыНалогообложения: {
          Значение: [
            "Перечисление.ТипыНалогообложенияНДС.ПродажаНаЭкспорт",
            "Перечисление.ТипыНалогообложенияНДС.ЭкспортСырьевыхТоваровУслуг",
          ],
        },
      },
    })
  })
})
