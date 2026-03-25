import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import {
  fullConditionalAppearanceCollectionYAML,
  fullConditionalAppearanceItem,
  minimalConditionalAppearanceCollectionYAML,
  minimalConditionalAppearanceItem,
} from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "ConditionalAppearance",
}

describe("import ConditionalAppearance from YAML", () => {
  it("imports full collection", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: fullConditionalAppearanceCollectionYAML,
    })

    expect(result).toEqual([{ ...fullConditionalAppearanceItem, name: "full" }])
  })

  it("imports minimal collection", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: minimalConditionalAppearanceCollectionYAML,
    })

    expect(result).toEqual([{ ...minimalConditionalAppearanceItem, name: "minimal" }])
  })
})
