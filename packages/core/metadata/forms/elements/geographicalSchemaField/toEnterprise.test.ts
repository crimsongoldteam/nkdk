import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/metadataFactory/elements/toEnterprise"
import {
  fullGeographicalSchemaField,
  fullGeographicalSchemaFieldEnterprise,
} from "~/tests/fixtures/forms/geographicalSchemaField/data"
import { mockContext } from "~/tests/mockContext"

describe("export GeographicalSchemaField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const context = {
      ...mockContext,
      preview: { prefix: "prefix_", attributes: {} },
    }
    const result = exportElementToEnterprise({
      context,
      itemType: CollectionFormElementType.GeographicalSchemaField,
      value: fullGeographicalSchemaField,
    })
    expect(result).toEqual(fullGeographicalSchemaFieldEnterprise)
  })
})
