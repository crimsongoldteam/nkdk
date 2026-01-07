import { describe, expect, it } from "vitest"
import { fullGraphicalSchemaField, fullGraphicalSchemaFieldEnterprise, minimalGraphicalSchemaField, minimalGraphicalSchemaFieldEnterprise } from "~/tests/fixtures/forms/graphicalSchemaField/data"
import { mockСontext } from "~/tests/mockContext"
import { exportGraphicalSchemaFieldToEnterprise } from "./exportToEnterprise"

describe("exportGraphicalSchemaFieldToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportGraphicalSchemaFieldToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportGraphicalSchemaFieldToEnterprise(mockСontext, fullGraphicalSchemaField)

    expect(result).toEqual(fullGraphicalSchemaFieldEnterprise)
  })

  it("should export minimal", () => {
    const result = exportGraphicalSchemaFieldToEnterprise(mockСontext, minimalGraphicalSchemaField)

    expect(result).toEqual(minimalGraphicalSchemaFieldEnterprise)
  })
})

