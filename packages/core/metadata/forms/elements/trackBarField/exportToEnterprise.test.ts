import { describe, expect, it } from "vitest"
import {
  fullTrackBarField,
  fullTrackBarFieldPartialEnterprise,
  fullTrackBarFieldTypedEnterprise,
  minimalTrackBarField,
  minimalTrackBarFieldPartialEnterprise,
} from "~/tests/fixtures/forms/trackBarField/data"
import { mockContext } from "~/tests/mockContext"
import { exportTrackBarFieldPartialToEnterprise, exportTrackBarFieldTypedToEnterprise } from "./exportToEnterprise"

describe("exportTrackBarFieldPartialToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportTrackBarFieldPartialToEnterprise(mockContext, fullTrackBarField)

    expect(result).toEqual(fullTrackBarFieldPartialEnterprise)
  })

  it("should export minimal", () => {
    const result = exportTrackBarFieldPartialToEnterprise(mockContext, minimalTrackBarField)

    expect(result).toEqual(minimalTrackBarFieldPartialEnterprise)
  })
})

describe("exportTrackBarFieldTypedToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportTrackBarFieldTypedToEnterprise(mockContext, fullTrackBarField)

    expect(result).toEqual(fullTrackBarFieldTypedEnterprise)
  })

  it("should return undefined when data is undefined", () => {
    const result = exportTrackBarFieldTypedToEnterprise(mockContext, undefined)

    expect(result).toBeUndefined()
  })
})
