import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
import {
  fullConditionalAppearanceCollectionYAML,
  fullConditionalAppearanceItem,
  minimalConditionalAppearanceCollectionYAML,
  minimalConditionalAppearanceItem,
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
      value: [{ ...fullConditionalAppearanceItem, name: "full" }],
    })

    expect(result).toEqual({ [rule.yaml!]: fullConditionalAppearanceCollectionYAML })
  })

  it("exports minimal collection", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: [{ ...minimalConditionalAppearanceItem, name: "minimal" }],
    })

    expect(result).toEqual({ [rule.yaml!]: minimalConditionalAppearanceCollectionYAML })
  })
})
