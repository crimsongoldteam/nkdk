import { describe, expect, it } from "vitest"
import {
  fullFormDecoration,
  fullFormDecorationEnterprise,
  minimalFormDecoration,
  minimalFormDecorationEnterprise,
} from "~/tests/fixtures/forms/formDecoration/data"
import { mockСontext } from "~/tests/mockContext"
import { importExtendedTooltipFromEnterprise } from "./importFromEnterprise"

describe("importExtendedTooltipFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importExtendedTooltipFromEnterprise(mockСontext, undefined, fullFormDecoration.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importExtendedTooltipFromEnterprise(
      mockСontext,
      fullFormDecorationEnterprise,
      fullFormDecoration.name
    )

    expect(result).toEqual(fullFormDecoration)
  })

  it("should import minimal", () => {
    const result = importExtendedTooltipFromEnterprise(
      mockСontext,
      minimalFormDecorationEnterprise,
      minimalFormDecoration.name
    )

    expect(result).toEqual(minimalFormDecoration)
  })

  it("should set elementType to FormDecoration", () => {
    const result = importExtendedTooltipFromEnterprise(
      mockСontext,
      fullFormDecorationEnterprise,
      fullFormDecoration.name
    )

    expect(result?.elementType).toBe(fullFormDecoration.elementType)
  })
})
