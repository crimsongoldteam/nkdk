import { describe, expect, it } from "vitest"
import { CollectionFormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
import {
  fullGraphicalSchemaField,
  fullGraphicalSchemaFieldPartialEnterprise,
  minimalGraphicalSchemaField,
  minimalGraphicalSchemaFieldPartialEnterprise,
} from "~/tests/fixtures/forms/graphicalSchemaField/data"
import { mockContext } from "~/tests/mockContext"

describe("importGraphicalSchemaFieldFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: CollectionFormElementType.GraphicalSchemaField,
      yaml: fullGraphicalSchemaFieldPartialEnterprise,
      source: fullGraphicalSchemaField,
    })

    expect(result).toEqual(fullGraphicalSchemaField)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: CollectionFormElementType.GraphicalSchemaField,
      yaml: minimalGraphicalSchemaFieldPartialEnterprise,
      source: minimalGraphicalSchemaField,
    })

    expect(result).toEqual(minimalGraphicalSchemaField)
  })
})
