import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
import { testExportPropertyModelThroughXMLToYAML } from "../../../../tests/property/exportPropertyModelThroughXMLToYAML"
import {
  fullConditionalAppearanceItems,
  fullConditionalAppearanceItemsYAML,
  minimalConditionalAppearanceItems,
  minimalConditionalAppearanceItemsYAML,
} from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "ConditionalAppearanceItems",
  yaml: "УсловноеОформлениеКомпоновкиДанных",
}

describe("export ConditionalAppearanceItems to YAML", () => {
  it("exports full collection", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: fullConditionalAppearanceItems,
      yaml: fullConditionalAppearanceItemsYAML,
    })

    expect(result).toEqual({ УсловноеОформлениеКомпоновкиДанных: fullConditionalAppearanceItemsYAML })
  })

  it("exports minimal collection", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: minimalConditionalAppearanceItems,
      yaml: minimalConditionalAppearanceItemsYAML,
    })

    expect(result).toEqual({ УсловноеОформлениеКомпоновкиДанных: minimalConditionalAppearanceItemsYAML })
  })
})
