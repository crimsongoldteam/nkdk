import { describe, expect, it } from "vitest"
import { fullGraphicalSchemaField, fullGraphicalSchemaFieldEnterprise, minimalGraphicalSchemaField, minimalGraphicalSchemaFieldEnterprise } from "~/tests/fixtures/forms/graphicalSchemaField/data"
import { mockСontext } from "~/tests/mockContext"
import { importGraphicalSchemaFieldFromEnterprise } from "./importFromEnterprise"

describe("importGraphicalSchemaFieldFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importGraphicalSchemaFieldFromEnterprise(mockСontext, undefined, fullGraphicalSchemaField.name)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importGraphicalSchemaFieldFromEnterprise(mockСontext, fullGraphicalSchemaFieldEnterprise, fullGraphicalSchemaField.name)
    result!.id = "1"

    expect(result).toEqual(fullGraphicalSchemaField)
  })

  it("should import minimal", () => {
    const result = importGraphicalSchemaFieldFromEnterprise(mockСontext, minimalGraphicalSchemaFieldEnterprise, minimalGraphicalSchemaField.name)
    result!.id = "1"

    expect(result).toEqual(minimalGraphicalSchemaField)
  })
})

