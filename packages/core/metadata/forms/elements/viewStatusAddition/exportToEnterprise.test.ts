import { describe, expect, it } from "vitest"
import {
  fullViewStatusAddition,
  fullViewStatusAdditionEnterprise,
  minimalViewStatusAddition,
  minimalViewStatusAdditionEnterprise,
} from "~/tests/fixtures/forms/viewStatusAddition/data"
import { mockСontext } from "~/tests/mockContext"
import { exportViewStatusAdditionToEnterprise } from "./exportToEnterprise"

describe("exportViewStatusAdditionToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportViewStatusAdditionToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportViewStatusAdditionToEnterprise(mockСontext, fullViewStatusAddition)

    expect(result).toEqual(fullViewStatusAdditionEnterprise)
  })

  it("should export minimal", () => {
    const result = exportViewStatusAdditionToEnterprise(mockСontext, minimalViewStatusAddition)

    expect(result).toEqual(minimalViewStatusAdditionEnterprise)
  })
})

