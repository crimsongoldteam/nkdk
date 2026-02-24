import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/metadataFactory/elements/toEnterprise"
import { fullCheckBoxField } from "~/tests/fixtures/forms/checkBoxField/data"
import { fullUsualGroupEnterprise } from "~/tests/fixtures/forms/usualGroup/data"
import { mockContext } from "~/tests/mockContext"

describe("export CheckBoxField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const context = {
      ...mockContext,
      preview: {
        prefix: "prefix_",
        attributes: {},
      },
    }
    const result = exportElementToEnterprise({
      context,
      itemType: CollectionFormElementType.CheckBoxField,
      value: fullCheckBoxField,
    })

    expect(result).toEqual(fullUsualGroupEnterprise)
  })
})
