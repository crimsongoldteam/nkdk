import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/metadataFactory/elements/toEnterprise"
import { fullRadioButtonField, fullRadioButtonFieldEnterprise } from "~/tests/fixtures/forms/radioButtonField/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("export RadioButtonField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      itemType: CollectionFormElementType.RadioButtonField,
      value: fullRadioButtonField,
    })
    expect(result).toEqual(fullRadioButtonFieldEnterprise)
  })
})
