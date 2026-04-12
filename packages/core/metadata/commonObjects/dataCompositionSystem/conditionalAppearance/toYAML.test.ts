import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
import {
  fullConditionalAppearanceItems,
  fullConditionalAppearanceItemsYAML,
  minimalConditionalAppearanceItems,
  minimalConditionalAppearanceItemsYAML,
} from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "ConditionalAppearance",
  yaml: "УсловноеОформлениеКомпоновкиДанных",
}

describe("export ConditionalAppearance to YAML", () => {
  it("exports full collection", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: fullConditionalAppearanceItems,
    })

    expect(result).toEqual({ УсловноеОформлениеКомпоновкиДанных: fullConditionalAppearanceItemsYAML })
  })

  it("exports minimal collection", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: minimalConditionalAppearanceItems,
    })

    expect(result).toEqual({ УсловноеОформлениеКомпоновкиДанных: minimalConditionalAppearanceItemsYAML })
  })
})
