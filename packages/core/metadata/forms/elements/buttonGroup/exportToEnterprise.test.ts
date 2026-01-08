import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/button/exportToEnterprise"
import {
  fullButtonGroup,
  fullButtonGroupEnterprise,
  minimalButtonGroup,
  minimalButtonGroupEnterprise,
} from "~/tests/fixtures/forms/buttonGroup/data"
import { mockСontext } from "~/tests/mockContext"
import { exportButtonGroupToEnterprise } from "./exportToEnterprise"

describe("exportButtonGroupToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportButtonGroupToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportButtonGroupToEnterprise(mockСontext, fullButtonGroup)

    expect(result).toEqual(fullButtonGroupEnterprise)
  })

  it("should export minimal", () => {
    const result = exportButtonGroupToEnterprise(mockСontext, minimalButtonGroup)

    expect(result).toEqual(minimalButtonGroupEnterprise)
  })
})
