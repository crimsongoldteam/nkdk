import { describe, expect, it } from "vitest"
import {
  fullButton,
  fullButtonEnterprise,
  minimalButton,
  minimalButtonEnterprise,
} from "~/tests/fixtures/forms/button/data"
import { mockСontext } from "~/tests/mockContext"
import { importButtonFromEnterprise } from "./importFromEnterprise"

describe("importButtonFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importButtonFromEnterprise(mockСontext, undefined, fullButton.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importButtonFromEnterprise(mockСontext, fullButtonEnterprise, fullButton.name)
    result!.id = "1"

    expect(result).toEqual(fullButton)
  })

  it("should import minimal", () => {
    const result = importButtonFromEnterprise(mockСontext, minimalButtonEnterprise, minimalButton.name)
    result!.id = "1"

    expect(result).toEqual(minimalButton)
  })
})
