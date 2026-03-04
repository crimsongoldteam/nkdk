import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML } from "~/metadata/orchestration"
import {
  fullGraphicalSchemaField,
  fullGraphicalSchemaFieldPartialYAML,
  minimalGraphicalSchemaField,
  minimalGraphicalSchemaFieldPartialYAML,
} from "~/tests/fixtures/forms/graphicalSchemaField/data"
import { mockContext } from "~/tests/mockContext"

describe("importGraphicalSchemaFieldFromYAML", () => {
  it("should import all fields from YAML", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: "GraphicalSchemaField",
      yaml: fullGraphicalSchemaFieldPartialYAML,
      source: fullGraphicalSchemaField,
    })

    expect(result).toEqual(fullGraphicalSchemaField)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: "GraphicalSchemaField",
      yaml: minimalGraphicalSchemaFieldPartialYAML,
      source: minimalGraphicalSchemaField,
    })

    expect(result).toEqual(minimalGraphicalSchemaField)
  })
})
