import { describe, expect, it } from "vitest"
import {
  fullTrackBarField,
  fullTrackBarFieldEnterprise,
  minimalTrackBarField,
  minimalTrackBarFieldEnterprise,
} from "~/tests/fixtures/forms/trackBarField/data"
import { mockСontext } from "~/tests/mockContext"
import { exportTrackBarFieldToEnterprise } from "./exportToEnterprise"

describe("exportTrackBarFieldToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportTrackBarFieldToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportTrackBarFieldToEnterprise(mockСontext, fullTrackBarField)

    expect(result).toEqual(fullTrackBarFieldEnterprise)
  })

  it("should export minimal", () => {
    const result = exportTrackBarFieldToEnterprise(mockСontext, minimalTrackBarField)

    expect(result).toEqual(minimalTrackBarFieldEnterprise)
  })
})

