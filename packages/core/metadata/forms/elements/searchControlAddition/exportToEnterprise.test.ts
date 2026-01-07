import { describe, expect, it } from "vitest"
import {
  fullSearchControlAddition,
  fullSearchControlAdditionEnterprise,
  minimalSearchControlAddition,
  minimalSearchControlAdditionEnterprise,
} from "~/tests/fixtures/forms/searchControlAddition/data"
import { mockСontext } from "~/tests/mockContext"
import { exportSearchControlAdditionToEnterprise } from "./exportToEnterprise"

describe("exportSearchControlAdditionToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportSearchControlAdditionToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportSearchControlAdditionToEnterprise(mockСontext, fullSearchControlAddition)

    expect(result).toEqual(fullSearchControlAdditionEnterprise)
  })

  it("should export minimal", () => {
    const result = exportSearchControlAdditionToEnterprise(mockСontext, minimalSearchControlAddition)

    expect(result).toEqual(minimalSearchControlAdditionEnterprise)
  })
})

