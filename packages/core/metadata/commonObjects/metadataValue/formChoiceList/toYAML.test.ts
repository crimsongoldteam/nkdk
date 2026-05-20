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
import { exportFormChoiceListToYAML } from "./toYAML"

describe("exportFormChoiceListToYAML", () => {
  it("exports formChoiceList with string value to YAML object", () => {
    const result = exportFormChoiceListToYAML(mockContext, withStringValue)
    expect(result).toEqual(withStringValueYAML)
  })

  it("exports formChoiceList without presentation to YAML object with empty presentation", () => {
    const result = exportFormChoiceListToYAML(mockContext, withoutPresentation)
    expect(result).toEqual(withoutPresentationYAML)
  })

  it("exports formChoiceList with numeric presentation to YAML object", () => {
    const result = exportFormChoiceListToYAML(mockContext, withNumericPresentation)
    expect(result).toEqual(withNumericPresentationYAML)
  })

  it("exports formChoiceList with multilingual presentation to YAML object", () => {
    const result = exportFormChoiceListToYAML(mockContext, withMultiLangPresentation)
    expect(result).toEqual(withMultiLangPresentationYAML)
  })
})
