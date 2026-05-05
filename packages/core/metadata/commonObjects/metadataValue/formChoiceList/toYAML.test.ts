import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import {
  withMultiLangPresentation,
  withMultiLangPresentationYAML,
  withStringValue,
  withStringValueYAML,
} from "./__fixtures__/data"
import { exportFormChoiceListToYAML } from "./toYAML"

describe("exportFormChoiceListToYAML", () => {
  it("should export formChoiceList with string value to YAML string", () => {
    const result = exportFormChoiceListToYAML(mockContext, withStringValue)
    expect(result).toEqual(withStringValueYAML)
  })

  it("should export formChoiceList with multilingual presentation to YAML object", () => {
    const result = exportFormChoiceListToYAML(mockContext, withMultiLangPresentation)
    expect(result).toEqual(withMultiLangPresentationYAML)
  })
})
