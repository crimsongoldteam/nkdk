import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/orchestration"
import {
  fullFormattedDocumentField,
  fullFormattedDocumentFieldPartialYAML,
  minimalFormattedDocumentField,
} from "~/metadata/forms/elements/formattedDocumentField/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"

describe("exportFormattedDocumentFieldToYAML", () => {
  it("should export all fields to YAML", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: fullFormattedDocumentField })

    expect(result).toEqual(fullFormattedDocumentFieldPartialYAML)
  })

  it("should export minimal", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: minimalFormattedDocumentField })

    expect(result).toBeUndefined()
  })
})
