import { describe, expect, it } from "vitest"
import {
  fullViewStatusAddition,
  fullViewStatusAdditionEnterprise,
  minimalViewStatusAddition,
} from "~/tests/fixtures/forms/viewStatusAddition/data"
import { mockContext } from "~/tests/mockContext"
import { exportViewStatusAdditionToEnterprise } from "./exportToEnterprise"

describe("exportViewStatusAdditionToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportViewStatusAdditionToEnterprise(mockContext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportViewStatusAdditionToEnterprise(mockContext, fullViewStatusAddition)

    expect(result).toEqual(fullViewStatusAdditionEnterprise)
  })

  it("should export minimal", () => {
    const result = exportViewStatusAdditionToEnterprise(mockContext, minimalViewStatusAddition)

    expect(result).toBeUndefined()
  })
})
