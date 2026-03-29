import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML } from "~/metadata/orchestration"
import {
  fullHtmlDocumentField,
  fullHtmlDocumentFieldPartialYAML,
  minimalHtmlDocumentField,
} from "~/metadata/forms/elements/htmlDocumentField/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"

describe("exportHTMLDocumentFieldToYAML", () => {
  it("should export all fields to YAML", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: fullHtmlDocumentField })

    expect(result).toEqual(fullHtmlDocumentFieldPartialYAML)
  })

  it("should export minimal", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: minimalHtmlDocumentField })

    expect(result).toBeUndefined()
  })
})
