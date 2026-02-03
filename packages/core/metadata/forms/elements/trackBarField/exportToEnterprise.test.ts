import { describe, expect, it } from "vitest"
import {
  fullTrackBarField,
  fullTrackBarFieldPartialEnterprise,
  fullTrackBarFieldTypedEnterprise,
  minimalTrackBarField,
  minimalTrackBarFieldPartialEnterprise,
} from "~/tests/fixtures/forms/trackBarField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportTrackBarFieldPartialToEnterprise, exportTrackBarFieldTypedToEnterprise } from "./exportToEnterprise"

describe("exportTrackBarFieldPartialToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportTrackBarFieldPartialToEnterprise(mockContext, mockRule, fullTrackBarField)

    expect(result).toEqual(fullTrackBarFieldPartialEnterprise)
  })

  it("should export minimal", () => {
    const result = exportTrackBarFieldPartialToEnterprise(mockContext, mockRule, minimalTrackBarField)

    expect(result).toEqual(minimalTrackBarFieldPartialEnterprise)
  })
})

describe("exportTrackBarFieldTypedToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportTrackBarFieldTypedToEnterprise(mockContext, mockRule, fullTrackBarField)

    expect(result).toEqual(fullTrackBarFieldTypedEnterprise)
  })

  it("should return undefined when data is undefined", () => {
    const result = exportTrackBarFieldTypedToEnterprise(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })
})
