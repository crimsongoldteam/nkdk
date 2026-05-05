import { describe, expect, it } from "vitest"
import {
  multipleCharacteristics,
  multipleCharacteristicsYAML,
  singleCharacteristic,
  singleCharacteristicYAML,
} from "./__fixtures__/data"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"

const rule: PropertyRule = { type: "CharacteristicsDescriptions" }

describe("importCharacteristicsDescriptionsFromYAML", () => {
  it("imports undefined", () => {
    const result = testImportPropertyFromYAML({ rule, value: undefined })
    expect(result).toBeUndefined()
  })

  it("imports empty array", () => {
    const result = testImportPropertyFromYAML({ rule, value: [] })
    expect(result).toBeUndefined()
  })

  it("imports single characteristic", () => {
    const result = testImportPropertyFromYAML({ rule, value: singleCharacteristicYAML })
    expect(result).toEqual(singleCharacteristic)
  })

  it("imports multiple characteristics", () => {
    const result = testImportPropertyFromYAML({ rule, value: multipleCharacteristicsYAML })
    expect(result).toEqual(multipleCharacteristics)
  })
})
