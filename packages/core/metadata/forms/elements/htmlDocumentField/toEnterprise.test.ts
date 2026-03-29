import { describe, expect, it } from "vitest"

import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { fullHtmlDocumentField, fullHtmlDocumentFieldEnterprise } from "~/metadata/forms/elements/htmlDocumentField/__fixtures__/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("export HTMLDocumentField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      value: fullHtmlDocumentField,
    })
    expect(result).toEqual(fullHtmlDocumentFieldEnterprise)
  })
})
