import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/metadataFactory/elements/toEnterprise"
import {
  fullGraphicalSchemaField,
  fullGraphicalSchemaFieldEnterprise,
} from "~/tests/fixtures/forms/graphicalSchemaField/data"
import { mockContext } from "~/tests/mockContext"

describe("export GraphicalSchemaField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const context = {
      ...mockContext,
      preview: { prefix: "prefix_", attributes: {} },
    }
    const result = exportElementToEnterprise({
      context,
      itemType: CollectionFormElementType.GraphicalSchemaField,
      value: fullGraphicalSchemaField,
    })
    expect(result).toEqual(fullGraphicalSchemaFieldEnterprise)
  })
})
