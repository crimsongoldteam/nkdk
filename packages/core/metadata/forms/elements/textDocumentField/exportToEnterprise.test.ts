import { describe, expect, it } from "vitest"
import {
  fullTextDocumentField,
  fullTextDocumentFieldEnterprise,
  minimalTextDocumentField,
  minimalTextDocumentFieldEnterprise,
} from "~/tests/fixtures/forms/textDocumentField/data"
import { mockСontext } from "~/tests/mockContext"
import { exportTextDocumentFieldToEnterprise } from "./exportToEnterprise"

describe("exportTextDocumentFieldToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportTextDocumentFieldToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportTextDocumentFieldToEnterprise(mockСontext, fullTextDocumentField)

    expect(result).toEqual(fullTextDocumentFieldEnterprise)
  })

  it("should export minimal", () => {
    const result = exportTextDocumentFieldToEnterprise(mockСontext, minimalTextDocumentField)

    expect(result).toEqual(minimalTextDocumentFieldEnterprise)
  })
})

