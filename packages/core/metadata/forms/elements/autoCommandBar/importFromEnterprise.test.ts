import { describe, expect, it } from "vitest"
import {
  fullPropsAutoCommandBar,
  fullPropsAutoCommandBarEnterprise,
  minimalAutoCommandBar,
  sourceAutoCommandBar,
} from "~/tests/fixtures/forms/autoCommandBar/data"
import { mockСontext } from "~/tests/mockContext"
import { importAutoCommandBarFromEnterprise } from "./importFromEnterprise"

describe("importAutoCommandBarFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importAutoCommandBarFromEnterprise(
      mockСontext,
      sourceAutoCommandBar,
      fullPropsAutoCommandBarEnterprise
    )

    expect(result).toEqual(fullPropsAutoCommandBar)
  })

  it("should import minimal", () => {
    const result = importAutoCommandBarFromEnterprise(mockСontext, sourceAutoCommandBar, {})

    expect(result).toEqual(minimalAutoCommandBar)
  })
})
