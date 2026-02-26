import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/metadataFactory/elements/toEnterprise"
import {
  fullRadioButtonField,
  fullRadioButtonFieldEnterprise,
} from "~/tests/fixtures/forms/radioButtonField/data"
import { mockContext } from "~/tests/mockContext"

describe("export RadioButtonField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const context = {
      ...mockContext,
      preview: { prefix: "prefix_", attributes: {} },
    }
    const result = exportElementToEnterprise({
      context,
      itemType: CollectionFormElementType.RadioButtonField,
      value: fullRadioButtonField,
    })
    expect(result).toEqual(fullRadioButtonFieldEnterprise)
  })
})
