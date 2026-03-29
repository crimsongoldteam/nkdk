import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/orchestration"
import {
  fullTextDocumentField,
  fullTextDocumentFieldPartialYAML,
  minimalTextDocumentField,
} from "~/metadata/forms/elements/textDocumentField/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"

describe("exportTextDocumentFieldToYAML", () => {
  it("should export all fields to YAML", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: fullTextDocumentField })

    expect(result).toEqual(fullTextDocumentFieldPartialYAML)
  })

  it("should export minimal", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: minimalTextDocumentField })

    expect(result).toBeUndefined()
  })
})
