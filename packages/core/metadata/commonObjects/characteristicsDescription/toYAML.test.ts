import { describe, expect, it } from "vitest"
import {
  multipleCharacteristics,
  multipleCharacteristicsYAML,
  singleCharacteristic,
  singleCharacteristicYAML,
} from "./__fixtures__/data"
import type { PropertyRule } from "../../orchestration/property/types"
import { testExportPropertyToYAML } from "../../../tests/property/exportPropertyToYAML"

const rule: PropertyRule = {
  type: "CharacteristicsDescriptions",
  yaml: "Характеристики",
}

describe("exportCharacteristicsDescriptionsToYAML", () => {
  it("exports undefined", () => {
    const result = testExportPropertyToYAML({ rule, value: undefined })
    expect(result).toBeUndefined()
  })

  it("exports empty array", () => {
    const result = testExportPropertyToYAML({ rule, value: [] })
    expect(result).toBeUndefined()
  })

  it("exports single characteristic", () => {
    const result = testExportPropertyToYAML({ rule, value: singleCharacteristic })
    expect(result).toEqual({ Характеристики: singleCharacteristicYAML })
  })

  it("exports multiple characteristics", () => {
    const result = testExportPropertyToYAML({ rule, value: multipleCharacteristics })
    expect(result).toEqual({ Характеристики: multipleCharacteristicsYAML })
  })
})
