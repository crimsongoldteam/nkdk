import { describe, expect, it } from "vitest"
import {
  multiple,
  multipleEnterprise,
  singleSimple,
  singleSimpleEnterprise,
} from "~/tests/fixtures/characteristicsDescription/data"
import { mockСontext } from "~/tests/mockContext"
import {
  exportCharacteristicsDescriptionToEnterprise,
  exportCharacteristicsDescriptionsToEnterprise,
} from "./exportToEnterprise"

describe("exportCharacteristicsDescriptionToEnterprise", () => {
  it("should export single characteristic", () => {
    const result = exportCharacteristicsDescriptionToEnterprise(mockСontext, singleSimple)

    expect(result).toEqual(singleSimpleEnterprise)
  })

  it("should export multiple characteristics", () => {
    const result = exportCharacteristicsDescriptionsToEnterprise(mockСontext, multiple)

    expect(result).toEqual(multipleEnterprise)
  })

  it("should return undefined for undefined input", () => {
    const result = exportCharacteristicsDescriptionToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should return undefined for undefined array input", () => {
    const result = exportCharacteristicsDescriptionsToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })
})
