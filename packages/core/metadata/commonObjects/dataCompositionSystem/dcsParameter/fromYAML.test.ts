import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import {
  explicitNullValueDCSParameters,
  explicitNullValueDCSParametersYAML,
  fullDCSParameters,
  fullDCSParametersYAML,
  minimalDCSParameters,
  minimalDCSParametersYAML,
} from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = { type: "DCSParameters" }

describe("import DCSParameter from YAML", () => {
  it("imports undefined", () => {
    const result = testImportPropertyFromYAML({ rule, value: undefined })
    expect(result).toBeUndefined()
  })

  it("imports minimal fixture", () => {
    const result = testImportPropertyFromYAML({ rule, value: minimalDCSParametersYAML })
    expect(result).toEqual(minimalDCSParameters)
  })

  it("imports full fixture", () => {
    const result = testImportPropertyFromYAML({ rule, value: fullDCSParametersYAML })
    expect(result).toEqual(fullDCSParameters)
  })

  it("imports explicit null value fixture", () => {
    const result = testImportPropertyFromYAML({ rule, value: explicitNullValueDCSParametersYAML })
    expect(result).toEqual(explicitNullValueDCSParameters)
  })

  it("imports multiple values", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: {
        ТипыНалогообложения: {
          Значение: [
            "Перечисление.ТипыНалогообложенияНДС.ПродажаНаЭкспорт",
            "Перечисление.ТипыНалогообложенияНДС.ЭкспортСырьевыхТоваровУслуг",
          ],
        },
      },
    })

    expect(result).toEqual([
      {
        itemType: "DCSParameter",
        name: "ТипыНалогообложения",
        value: [
          {
            type: "DesignTimeValue",
            value: "Перечисление.ТипыНалогообложенияНДС.ПродажаНаЭкспорт",
          },
          {
            type: "DesignTimeValue",
            value: "Перечисление.ТипыНалогообложенияНДС.ЭкспортСырьевыхТоваровУслуг",
          },
        ],
      },
    ])
  })
})
