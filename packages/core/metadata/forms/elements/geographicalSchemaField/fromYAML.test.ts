import { describe, expect, it } from "vitest"
import { CollectionFormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
import {
  fullGeographicalSchemaField,
  fullGeographicalSchemaFieldPartialYAML,
  minimalGeographicalSchemaField,
  minimalGeographicalSchemaFieldPartialYAML,
} from "~/tests/fixtures/forms/geographicalSchemaField/data"
import { mockContext } from "~/tests/mockContext"

describe("importGeographicalSchemaFieldFromYAML", () => {
  describe("importGeographicalSchemaFieldPartialFromYAML", () => {
    it("should import all fields from YAML", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: CollectionFormElementType.GeographicalSchemaField,
        yaml: fullGeographicalSchemaFieldPartialYAML,
        source: fullGeographicalSchemaField,
      })

      expect(result).toEqual(fullGeographicalSchemaField)
    })

    it("should import minimal", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: CollectionFormElementType.GeographicalSchemaField,
        yaml: minimalGeographicalSchemaFieldPartialYAML,
        source: minimalGeographicalSchemaField,
      })

      expect(result).toEqual(minimalGeographicalSchemaField)
    })
  })
})
