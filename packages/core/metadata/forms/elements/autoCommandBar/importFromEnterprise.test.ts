import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/importFromEnterprise"
import {
  fullAutoCommandBar,
  fullAutoCommandBarAllItems,
  fullAutoExportCommandBarEnterprise,
  minimalAutoCommandBar,
  sourceAutoCommandBar,
} from "~/tests/fixtures/forms/autoCommandBar/data"
import { mockСontext } from "~/tests/mockContext"
import { importAutoCommandBarFromEnterprise } from "./importFromEnterprise"

describe("importAutoCommandBarFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const context = {
      ...mockСontext,
      allElements: fullAutoCommandBarAllItems,
    }

    const result = importAutoCommandBarFromEnterprise(context, sourceAutoCommandBar, fullAutoExportCommandBarEnterprise)

    expect(result).toEqual(fullAutoCommandBar)
  })

  it("should import minimal", () => {
    const result = importAutoCommandBarFromEnterprise(mockСontext, undefined, {})

    expect(result).toEqual(minimalAutoCommandBar)
  })
})
