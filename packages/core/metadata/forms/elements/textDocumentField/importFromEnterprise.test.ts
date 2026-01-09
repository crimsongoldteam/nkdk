import { describe, expect, it } from "vitest"
import {
  fullTextDocumentField,
  fullTextDocumentFieldEnterprise,
  minimalTextDocumentField,
  minimalTextDocumentFieldEnterprise,
} from "~/tests/fixtures/forms/textDocumentField/data"
import { mockСontext } from "~/tests/mockContext"
import { importTextDocumentFieldFromEnterprise } from "./importFromEnterprise"

describe("importTextDocumentFieldFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importTextDocumentFieldFromEnterprise(mockСontext, undefined, fullTextDocumentField.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importTextDocumentFieldFromEnterprise(
      mockСontext,
      fullTextDocumentFieldEnterprise,
      fullTextDocumentField.name
    )

    expect(result).toEqual(fullTextDocumentField)
  })

  it("should import minimal", () => {
    const result = importTextDocumentFieldFromEnterprise(
      mockСontext,
      minimalTextDocumentFieldEnterprise,
      minimalTextDocumentField.name
    )

    expect(result).toEqual(minimalTextDocumentField)
  })
})
