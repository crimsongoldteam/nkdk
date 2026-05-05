import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import {
  fullConditionalAppearanceItems,
  fullConditionalAppearanceItemsYAML,
  minimalConditionalAppearanceItems,
  minimalConditionalAppearanceItemsYAML,
} from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "ConditionalAppearanceItems",
}

describe("import ConditionalAppearanceItems from YAML", () => {
  it("imports full collection", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: fullConditionalAppearanceItemsYAML,
    })

    expect(result).toEqual(fullConditionalAppearanceItems)
  })

  it("imports minimal collection", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: minimalConditionalAppearanceItemsYAML,
    })

    expect(result).toEqual(minimalConditionalAppearanceItems)
  })
})
