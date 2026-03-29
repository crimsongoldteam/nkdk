import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML } from "~/metadata/orchestration"
import {
  fullRadioButtonField,
  fullRadioButtonFieldPartialYAML,
  minimalRadioButtonField,
  minimalRadioButtonFieldPartialYAML,
} from "~/metadata/forms/elements/radioButtonField/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"

describe("importRadioButtonFieldFromYAML", () => {
  it("should import all fields from YAML", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: "RadioButtonField",
      yaml: fullRadioButtonFieldPartialYAML,
      source: fullRadioButtonField,
    })

    expect(result).toEqual(fullRadioButtonField)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: "RadioButtonField",
      yaml: minimalRadioButtonFieldPartialYAML,
      source: minimalRadioButtonField,
    })

    expect(result).toEqual(minimalRadioButtonField)
  })
})
