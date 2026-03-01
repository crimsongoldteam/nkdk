import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { exportElementToEnterprise } from "~/metadata/metadataFactory/elements/toEnterprise"
import {
  fullGeographicalSchemaField,
  fullGeographicalSchemaFieldEnterprise,
} from "~/tests/fixtures/forms/geographicalSchemaField/data"
import { mockContextToEnterprise } from "~/tests/mockContext"

describe("export GeographicalSchemaField to Enterprise", () => {
  it("should export all fields to Enterprise", () => {
    const result = exportElementToEnterprise({
      context: mockContextToEnterprise,
      itemType: CollectionFormElementType.GeographicalSchemaField,
      value: fullGeographicalSchemaField,
    })
    expect(result).toEqual(fullGeographicalSchemaFieldEnterprise)
  })
})
