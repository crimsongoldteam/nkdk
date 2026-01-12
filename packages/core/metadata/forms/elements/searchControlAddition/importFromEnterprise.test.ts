import { describe, expect, it } from "vitest"
import {
  fullSearchControlAddition,
  fullSearchControlAdditionEnterprise,
  minimalSearchControlAddition,
  minimalSearchControlAdditionEnterprise,
} from "~/tests/fixtures/forms/searchControlAddition/data"
import { mockСontext } from "~/tests/mockContext"
import { importSearchControlAdditionFromEnterprise } from "./importFromEnterprise"

describe("importSearchControlAdditionFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importSearchControlAdditionFromEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importSearchControlAdditionFromEnterprise(mockСontext, fullSearchControlAdditionEnterprise)

    expect(result).toEqual(fullSearchControlAddition)
  })

  it("should import minimal", () => {
    const result = importSearchControlAdditionFromEnterprise(mockСontext, minimalSearchControlAdditionEnterprise)

    expect(result).toEqual(minimalSearchControlAddition)
  })
})
