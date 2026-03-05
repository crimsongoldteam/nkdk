import { describe, expect, it } from "vitest"
import type { FormElementsYAML } from "~/metadata/forms/commonObjects/childItems/types"
import { importPropertyFromYAML, PropertyRule } from "~/metadata/orchestration"
import { fullCommandBarChildItemsAllYAML } from "~/tests/fixtures/commandBarChildItems/data"
import {
  fullAutoCommandBar,
  fullAutoExportCommandBarYAML,
  minimalAutoCommandBar,
  sourceAutoCommandBar,
} from "~/tests/fixtures/forms/autoCommandBar/data"
import { mockContext } from "~/tests/mockContext"

const rule: PropertyRule = { type: "AutoCommandBar" }

const context = {
  ...mockContext,
  allElements: fullCommandBarChildItemsAllYAML as FormElementsYAML,
}

describe("importAutoCommandBarFromYAML", () => {
  it("should import all fields from YAML", () => {
    const result = importPropertyFromYAML({
      context: context,
      rule: rule,
      value: fullAutoExportCommandBarYAML,
      sourceValue: sourceAutoCommandBar,
    })

    expect(result).toEqual(fullAutoCommandBar)
  })

  it("should import minimal", () => {
    const result = importPropertyFromYAML({
      context: mockContext,
      rule: rule,
      value: undefined,
      sourceValue: minimalAutoCommandBar,
    })
    expect(result).toEqual(minimalAutoCommandBar)
  })
})
