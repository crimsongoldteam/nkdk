import { describe, expect, it } from "vitest"
import { fullSearchStringAddition, fullSearchStringAdditionEnterprise } from "~/tests/fixtures/forms/searchStringAddition/data"
import { mockСontext } from "~/tests/mockContext"
import { importSearchStringAdditionFromEnterprise } from "./importFromEnterprise"

describe("importSearchStringAdditionFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importSearchStringAdditionFromEnterprise(mockСontext, fullSearchStringAdditionEnterprise)

    expect(result).toEqual(fullSearchStringAddition)
  })

  it("should import minimal", () => {
    const result = importSearchStringAdditionFromEnterprise(mockСontext, {})

    expect(result).toEqual({})
  })
})

