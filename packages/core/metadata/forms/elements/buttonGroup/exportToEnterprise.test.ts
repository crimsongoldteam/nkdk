import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/button/exportToEnterprise"
import {
  fullButtonGroup,
  fullButtonGroupChildEnterprise,
  fullButtonGroupEnterprise,
  minimalButtonGroup,
  minimalButtonGroupEnterprise,
} from "~/tests/fixtures/forms/buttonGroup/data"
import { mockСontext } from "~/tests/mockContext"
import { exportButtonGroupChildToEnterprise, exportButtonGroupToEnterprise } from "./exportToEnterprise"

describe("exportButtonGroupToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportButtonGroupToEnterprise(mockСontext, fullButtonGroup)

    expect(result).toEqual(fullButtonGroupEnterprise)
  })

  it("should export minimal", () => {
    const result = exportButtonGroupToEnterprise(mockСontext, minimalButtonGroup)

    expect(result).toEqual(minimalButtonGroupEnterprise)
  })
})

describe("exportButtonGroupChildToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportButtonGroupChildToEnterprise(mockСontext, fullButtonGroup)

    expect(result).toEqual(fullButtonGroupChildEnterprise)
  })

  it("should return undefined when data is undefined", () => {
    const result = exportButtonGroupChildToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })
})
