import { describe, expect, it } from "vitest"
import { fullProgressBarField, fullProgressBarFieldEnterprise, minimalProgressBarField, minimalProgressBarFieldEnterprise } from "~/tests/fixtures/forms/progressBarField/data"
import { mockСontext } from "~/tests/mockContext"
import { exportProgressBarFieldToEnterprise } from "./exportToEnterprise"

describe("exportProgressBarFieldToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportProgressBarFieldToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportProgressBarFieldToEnterprise(mockСontext, fullProgressBarField)

    expect(result).toEqual(fullProgressBarFieldEnterprise)
  })

  it("should export minimal", () => {
    const result = exportProgressBarFieldToEnterprise(mockСontext, minimalProgressBarField)

    expect(result).toEqual(minimalProgressBarFieldEnterprise)
  })
})


