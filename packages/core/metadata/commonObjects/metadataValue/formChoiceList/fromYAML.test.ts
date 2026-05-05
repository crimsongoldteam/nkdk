import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import {
  withMultiLangPresentation,
  withMultiLangPresentationYAML,
  withStringValue,
  withStringValueYAML,
} from "./__fixtures__/data"
import { importFormChoiceListFromYAML } from "./fromYAML"

describe("importFormChoiceListFromYAML", () => {
  it("should import formChoiceList with string value from YAML string", () => {
    const result = importFormChoiceListFromYAML(mockContext, withStringValueYAML)
    expect(result).toEqual(withStringValue)
  })

  it("should import formChoiceList with multilingual presentation from YAML object", () => {
    const result = importFormChoiceListFromYAML(mockContext, withMultiLangPresentationYAML)
    expect(result).toEqual(withMultiLangPresentation)
  })
})
