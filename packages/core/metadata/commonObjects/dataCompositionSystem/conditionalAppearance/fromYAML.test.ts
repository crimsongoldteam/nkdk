import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import {
  fullConditionalAppearanceItem,
  fullConditionalAppearanceItemYAML,
  minimalConditionalAppearanceItem,
  minimalConditionalAppearanceItemYAML,
} from "./__fixtures__/data"
import { importConditionalAppearanceItemFromYAML } from "./fromYAML"

describe("importConditionalAppearanceItemFromYAML", () => {
  it("imports full fixture YAML from data.ts", () => {
    expect(
      importConditionalAppearanceItemFromYAML(mockContext, fullConditionalAppearanceItemYAML)
    ).toEqual(fullConditionalAppearanceItem)
  })

  it("imports minimal fixture YAML from data.ts", () => {
    expect(
      importConditionalAppearanceItemFromYAML(mockContext, minimalConditionalAppearanceItemYAML)
    ).toEqual(minimalConditionalAppearanceItem)
  })
})
