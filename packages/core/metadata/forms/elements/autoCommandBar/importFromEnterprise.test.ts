import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/importFromEnterprise"
import {
  fullAutoExportCommandBarEnterprise,
  fullChildItems,
  fullPropsAutoCommandBar,
  minimalAutoCommandBar,
  sourceAutoCommandBar,
} from "~/tests/fixtures/forms/autoCommandBar/data"
import { mockСontext } from "~/tests/mockContext"
import { importAutoCommandBarFromEnterprise } from "./importFromEnterprise"

describe("importAutoCommandBarFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const context = {
      ...mockСontext,
      allElements: fullChildItems,
    }

    const result = importAutoCommandBarFromEnterprise(context, sourceAutoCommandBar, fullAutoExportCommandBarEnterprise)

    expect(result).toEqual(fullPropsAutoCommandBar)
  })

  it("should import minimal", () => {
    const result = importAutoCommandBarFromEnterprise(mockСontext, sourceAutoCommandBar, {})

    expect(result).toEqual(minimalAutoCommandBar)
  })
})
