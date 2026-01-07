import { describe, expect, it } from "vitest"
import {
  fullTrackBarField,
  fullTrackBarFieldEnterprise,
  minimalTrackBarField,
  minimalTrackBarFieldEnterprise,
} from "~/tests/fixtures/forms/trackBarField/data"
import { mockСontext } from "~/tests/mockContext"
import { importTrackBarFieldFromEnterprise } from "./importFromEnterprise"

describe("importTrackBarFieldFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importTrackBarFieldFromEnterprise(mockСontext, undefined, fullTrackBarField.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importTrackBarFieldFromEnterprise(
      mockСontext,
      fullTrackBarFieldEnterprise,
      fullTrackBarField.name
    )
    result!.id = "1"

    expect(result).toEqual(fullTrackBarField)
  })

  it("should import minimal", () => {
    const result = importTrackBarFieldFromEnterprise(
      mockСontext,
      minimalTrackBarFieldEnterprise,
      minimalTrackBarField.name
    )
    result!.id = "1"

    expect(result).toEqual(minimalTrackBarField)
  })
})

