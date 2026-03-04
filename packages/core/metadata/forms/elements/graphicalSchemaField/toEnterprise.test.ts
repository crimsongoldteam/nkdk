import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import {
  fullGraphicalSchemaField,
  fullGraphicalSchemaFieldEnterprise,
} from "~/tests/fixtures/forms/graphicalSchemaField/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("export GraphicalSchemaField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      itemType: CollectionFormElementType.GraphicalSchemaField,
      value: fullGraphicalSchemaField,
    })
    expect(result).toEqual(fullGraphicalSchemaFieldEnterprise)
  })
})
