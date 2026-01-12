import { describe, expect, it } from "vitest"
import {
  fullSearchStringAddition,
  fullSearchStringAdditionEnterprise,
  minimalSearchStringAddition,
} from "~/tests/fixtures/forms/searchStringAddition/data"
import { mockСontext } from "~/tests/mockContext"
import { exportSearchStringAdditionToEnterprise } from "./exportToEnterprise"

describe("exportSearchStringAdditionToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportSearchStringAdditionToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportSearchStringAdditionToEnterprise(mockСontext, fullSearchStringAddition)

    expect(result).toEqual(fullSearchStringAdditionEnterprise)
  })

  it("should export minimal", () => {
    const result = exportSearchStringAdditionToEnterprise(mockСontext, minimalSearchStringAddition)

    expect(result).toBeUndefined()
  })
})
