import { describe, expect, it } from "vitest"
import { fullViewStatusAddition, fullViewStatusAdditionEnterprise } from "~/tests/fixtures/forms/viewStatusAddition/data"
import { mockСontext } from "~/tests/mockContext"
import { importViewStatusAdditionFromEnterprise } from "./importFromEnterprise"

describe("importViewStatusAdditionFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importViewStatusAdditionFromEnterprise(mockСontext, fullViewStatusAdditionEnterprise)

    expect(result).toEqual(fullViewStatusAddition)
  })

  it("should import minimal", () => {
    const result = importViewStatusAdditionFromEnterprise(mockСontext, {})

    expect(result).toEqual({})
  })
})
