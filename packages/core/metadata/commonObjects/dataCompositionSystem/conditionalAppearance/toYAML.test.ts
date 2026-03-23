import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import {
  fullConditionalAppearanceItem,
  fullConditionalAppearanceItemYAML,
  minimalConditionalAppearanceItem,
  minimalConditionalAppearanceItemYAML,
} from "./__fixtures__/data"
import { exportConditionalAppearanceItemToYAML } from "./toYAML"

describe("exportConditionalAppearanceItemToYAML", () => {
  it("exports full model to YAML matching data.ts", () => {
    expect(exportConditionalAppearanceItemToYAML(mockContext, fullConditionalAppearanceItem)).toEqual(
      fullConditionalAppearanceItemYAML
    )
  })

  it("exports minimal model to YAML matching data.ts", () => {
    expect(exportConditionalAppearanceItemToYAML(mockContext, minimalConditionalAppearanceItem)).toEqual(
      minimalConditionalAppearanceItemYAML
    )
  })
})
