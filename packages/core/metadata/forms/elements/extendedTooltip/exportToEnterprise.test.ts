import { describe, expect, it } from "vitest"
import {
  fullFormDecoration,
  fullFormDecorationEnterprise,
  minimalFormDecoration,
  minimalFormDecorationEnterprise,
} from "~/tests/fixtures/forms/formDecoration/data"
import { mockСontext } from "~/tests/mockContext"
import { exportExtendedTooltipToEnterprise } from "./exportToEnterprise"

describe("exportExtendedTooltipToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportExtendedTooltipToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportExtendedTooltipToEnterprise(mockСontext, fullFormDecoration)

    expect(result).toEqual(fullFormDecorationEnterprise)
  })

  it("should export minimal", () => {
    const result = exportExtendedTooltipToEnterprise(mockСontext, minimalFormDecoration)

    expect(result).toEqual(minimalFormDecorationEnterprise)
  })
})
