import { describe, expect, it } from "vitest"
import { fullInputField, fullInputFieldPreview } from "~/tests/fixtures/forms/inputField/data"
import { mockСontext } from "~/tests/mockContext"

describe("exportInputFieldToPreview", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportInputFieldToPreview(mockСontext, fullInputField)

    expect(result).toEqual(fullInputFieldPreview)
  })
})
