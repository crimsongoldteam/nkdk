import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/metadataFactory/elements/toEnterprise"
import { fullCheckBoxField, fullCheckBoxFieldEnterprise } from "~/tests/fixtures/forms/checkBoxField/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("export CheckBoxField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      itemType: CollectionFormElementType.CheckBoxField,
      value: fullCheckBoxField,
    })
    expect(result).toEqual(fullCheckBoxFieldEnterprise)
  })
})
