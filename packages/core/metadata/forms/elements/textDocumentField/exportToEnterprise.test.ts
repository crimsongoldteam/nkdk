import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/metadataFactory"
import {
  fullTextDocumentField,
  fullTextDocumentFieldPartialEnterprise,
  minimalTextDocumentField,
} from "~/tests/fixtures/forms/textDocumentField/data"
import { mockContext } from "~/tests/mockContext"

describe("exportTextDocumentFieldToEnterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: fullTextDocumentField })

    expect(result).toEqual(fullTextDocumentFieldPartialEnterprise)
  })

  it("should export minimal", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: minimalTextDocumentField })

    expect(result).toBeUndefined()
  })
})
