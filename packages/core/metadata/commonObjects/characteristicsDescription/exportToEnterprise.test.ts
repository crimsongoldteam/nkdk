import { describe, expect, it } from "vitest"
import {
  multiple,
  multipleYAML,
  singleSimple,
  singleSimpleYAML,
} from "~/tests/fixtures/characteristicsDescription/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportCharacteristicsDescriptionToYAML, exportCharacteristicsDescriptionsToYAML } from "./toYAML"

describe("exportCharacteristicsDescriptionToYAML", () => {
  it("should export single characteristic", () => {
    const result = exportCharacteristicsDescriptionToYAML(mockContext, mockRule, singleSimple)

    expect(result).toEqual(singleSimpleYAML)
  })

  it("should export multiple characteristics", () => {
    const result = exportCharacteristicsDescriptionsToYAML(mockContext, mockRule, multiple)

    expect(result).toEqual(multipleYAML)
  })

  it("should return undefined for undefined input", () => {
    const result = exportCharacteristicsDescriptionToYAML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should return undefined for undefined array input", () => {
    const result = exportCharacteristicsDescriptionsToYAML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })
})
