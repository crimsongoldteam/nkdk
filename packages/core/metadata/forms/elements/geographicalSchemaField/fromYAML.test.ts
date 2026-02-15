import { describe, expect, it } from "vitest"
import { CollectionFormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
import {
  fullGeographicalSchemaField,
  fullGeographicalSchemaFieldPartialEnterprise,
  minimalGeographicalSchemaField,
  minimalGeographicalSchemaFieldPartialEnterprise,
} from "~/tests/fixtures/forms/geographicalSchemaField/data"
import { mockContext } from "~/tests/mockContext"

describe("importGeographicalSchemaFieldFromEnterprise", () => {
  describe("importGeographicalSchemaFieldPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: CollectionFormElementType.GeographicalSchemaField,
        yaml: fullGeographicalSchemaFieldPartialEnterprise,
        source: fullGeographicalSchemaField,
      })

      expect(result).toEqual(fullGeographicalSchemaField)
    })

    it("should import minimal", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: CollectionFormElementType.GeographicalSchemaField,
        yaml: minimalGeographicalSchemaFieldPartialEnterprise,
        source: minimalGeographicalSchemaField,
      })

      expect(result).toEqual(minimalGeographicalSchemaField)
    })
  })
})
