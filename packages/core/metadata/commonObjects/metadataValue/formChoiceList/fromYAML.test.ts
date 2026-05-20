import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import {
  withMultiLangPresentation,
  withMultiLangPresentationYAML,
  withNumericPresentation,
  withNumericPresentationYAML,
  withStringValue,
  withStringValueYAML,
  withoutPresentation,
  withoutPresentationYAML,
} from "./__fixtures__/data"
import { importFormChoiceListFromYAML } from "./fromYAML"

describe("importFormChoiceListFromYAML", () => {
  it("imports formChoiceList with string value from YAML object", () => {
    const result = importFormChoiceListFromYAML(mockContext, withStringValueYAML)
    expect(result).toEqual(withStringValue)
  })

  it("imports formChoiceList without presentation from YAML object", () => {
    const result = importFormChoiceListFromYAML(mockContext, withoutPresentationYAML)
    expect(result).toEqual(withoutPresentation)
  })

  it("imports formChoiceList with numeric presentation from YAML object", () => {
    const result = importFormChoiceListFromYAML(mockContext, withNumericPresentationYAML)
    expect(result).toEqual(withNumericPresentation)
  })

  it("imports formChoiceList with multilingual presentation from YAML object", () => {
    const result = importFormChoiceListFromYAML(mockContext, withMultiLangPresentationYAML)
    expect(result).toEqual(withMultiLangPresentation)
  })
})
