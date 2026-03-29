import { describe, expect, it } from "vitest"

import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import {
  fullFormattedDocumentField,
  fullFormattedDocumentFieldEnterprise,
} from "~/metadata/forms/elements/formattedDocumentField/__fixtures__/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("export FormattedDocumentField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      value: fullFormattedDocumentField,
    })
    expect(result).toEqual(fullFormattedDocumentFieldEnterprise)
  })
})
