import { describe, expect, it } from "vitest"
import { fullGeographicalSchemaField, fullGeographicalSchemaFieldEnterprise, minimalGeographicalSchemaField, minimalGeographicalSchemaFieldEnterprise } from "~/tests/fixtures/forms/geographicalSchemaField/data"
import { mockСontext } from "~/tests/mockContext"
import { exportGeographicalSchemaFieldToEnterprise } from "./exportToEnterprise"

describe("exportGeographicalSchemaFieldToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportGeographicalSchemaFieldToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportGeographicalSchemaFieldToEnterprise(mockСontext, fullGeographicalSchemaField)

    expect(result).toEqual(fullGeographicalSchemaFieldEnterprise)
  })

  it("should export minimal", () => {
    const result = exportGeographicalSchemaFieldToEnterprise(mockСontext, minimalGeographicalSchemaField)

    expect(result).toEqual(minimalGeographicalSchemaFieldEnterprise)
  })
})

