import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML } from "~/metadata/metadataFactory"
import {
  fullRadioButtonField,
  fullRadioButtonFieldPartialEnterprise,
  minimalRadioButtonField,
  minimalRadioButtonFieldPartialEnterprise,
} from "~/tests/fixtures/forms/radioButtonField/data"
import { mockContext } from "~/tests/mockContext"

describe("importRadioButtonFieldFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: CollectionFormElementType.RadioButtonField,
      yaml: fullRadioButtonFieldPartialEnterprise,
      source: fullRadioButtonField,
    })

    expect(result).toEqual(fullRadioButtonField)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: CollectionFormElementType.RadioButtonField,
      yaml: minimalRadioButtonFieldPartialEnterprise,
      source: minimalRadioButtonField,
    })

    expect(result).toEqual(minimalRadioButtonField)
  })
})
