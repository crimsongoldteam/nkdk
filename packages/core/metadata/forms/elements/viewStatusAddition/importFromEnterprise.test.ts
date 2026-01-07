import { describe, expect, it } from "vitest"
import {
  fullViewStatusAddition,
  fullViewStatusAdditionEnterprise,
  minimalViewStatusAddition,
  minimalViewStatusAdditionEnterprise,
} from "~/tests/fixtures/forms/viewStatusAddition/data"
import { mockСontext } from "~/tests/mockContext"
import { importViewStatusAdditionFromEnterprise } from "./importFromEnterprise"

describe("importViewStatusAdditionFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importViewStatusAdditionFromEnterprise(mockСontext, undefined, fullViewStatusAddition.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importViewStatusAdditionFromEnterprise(
      mockСontext,
      fullViewStatusAdditionEnterprise,
      fullViewStatusAddition.name
    )
    result!.id = "1"

    expect(result).toEqual(fullViewStatusAddition)
  })

  it("should import minimal", () => {
    const result = importViewStatusAdditionFromEnterprise(
      mockСontext,
      minimalViewStatusAdditionEnterprise,
      minimalViewStatusAddition.name
    )
    result!.id = "1"

    expect(result).toEqual(minimalViewStatusAddition)
  })
})

