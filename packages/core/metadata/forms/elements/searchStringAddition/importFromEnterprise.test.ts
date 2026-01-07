import { describe, expect, it } from "vitest"
import {
  fullSearchStringAddition,
  fullSearchStringAdditionEnterprise,
  minimalSearchStringAddition,
  minimalSearchStringAdditionEnterprise,
} from "~/tests/fixtures/forms/searchStringAddition/data"
import { mockСontext } from "~/tests/mockContext"
import { importSearchStringAdditionFromEnterprise } from "./importFromEnterprise"

describe("importSearchStringAdditionFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importSearchStringAdditionFromEnterprise(mockСontext, undefined, fullSearchStringAddition.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importSearchStringAdditionFromEnterprise(
      mockСontext,
      fullSearchStringAdditionEnterprise,
      fullSearchStringAddition.name
    )
    result!.id = "1"

    expect(result).toEqual(fullSearchStringAddition)
  })

  it("should import minimal", () => {
    const result = importSearchStringAdditionFromEnterprise(
      mockСontext,
      minimalSearchStringAdditionEnterprise,
      minimalSearchStringAddition.name
    )
    result!.id = "1"

    expect(result).toEqual(minimalSearchStringAddition)
  })
})

