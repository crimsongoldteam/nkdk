import { describe, expect, it } from "vitest"
import { fullProgressBarField, fullProgressBarFieldEnterprise, minimalProgressBarField, minimalProgressBarFieldEnterprise } from "~/tests/fixtures/forms/progressBarField/data"
import { mockСontext } from "~/tests/mockContext"
import { importProgressBarFieldFromEnterprise } from "./importFromEnterprise"

describe("importProgressBarFieldFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importProgressBarFieldFromEnterprise(mockСontext, undefined, fullProgressBarField.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importProgressBarFieldFromEnterprise(mockСontext, fullProgressBarFieldEnterprise, fullProgressBarField.name)
    result!.id = "1"

    expect(result).toEqual(fullProgressBarField)
  })

  it("should import minimal", () => {
    const result = importProgressBarFieldFromEnterprise(mockСontext, minimalProgressBarFieldEnterprise, minimalProgressBarField.name)
    result!.id = "1"

    expect(result).toEqual(minimalProgressBarField)
  })
})


