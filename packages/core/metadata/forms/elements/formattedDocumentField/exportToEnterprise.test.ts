import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/metadataFactory"
import {
  fullFormattedDocumentField,
  fullFormattedDocumentFieldPartialEnterprise,
  minimalFormattedDocumentField,
} from "~/tests/fixtures/forms/formattedDocumentField/data"
import { mockContext } from "~/tests/mockContext"

describe("exportFormattedDocumentFieldToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: fullFormattedDocumentField })

    expect(result).toEqual(fullFormattedDocumentFieldPartialEnterprise)
  })

  it("should export minimal", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: minimalFormattedDocumentField })

    expect(result).toBeUndefined()
  })
})
