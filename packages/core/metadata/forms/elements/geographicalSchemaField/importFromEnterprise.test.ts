import { describe, expect, it } from "vitest"
import { fullGeographicalSchemaField, fullGeographicalSchemaFieldEnterprise, minimalGeographicalSchemaField, minimalGeographicalSchemaFieldEnterprise } from "~/tests/fixtures/forms/geographicalSchemaField/data"
import { mockСontext } from "~/tests/mockContext"
import { importGeographicalSchemaFieldFromEnterprise } from "./importFromEnterprise"

describe("importGeographicalSchemaFieldFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importGeographicalSchemaFieldFromEnterprise(mockСontext, undefined, fullGeographicalSchemaField.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importGeographicalSchemaFieldFromEnterprise(mockСontext, fullGeographicalSchemaFieldEnterprise, fullGeographicalSchemaField.name)
    result!.id = "1"

    expect(result).toEqual(fullGeographicalSchemaField)
  })

  it("should import minimal", () => {
    const result = importGeographicalSchemaFieldFromEnterprise(mockСontext, minimalGeographicalSchemaFieldEnterprise, minimalGeographicalSchemaField.name)
    result!.id = "1"

    expect(result).toEqual(minimalGeographicalSchemaField)
  })
})

