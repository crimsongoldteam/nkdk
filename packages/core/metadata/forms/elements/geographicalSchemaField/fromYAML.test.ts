import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
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
        itemType: FormElementType.GeographicalSchemaField,
        yaml: fullGeographicalSchemaFieldPartialEnterprise,
        source: fullGeographicalSchemaField,
      })

      expect(result).toEqual(fullGeographicalSchemaField)
    })

    it("should import minimal", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: FormElementType.GeographicalSchemaField,
        yaml: minimalGeographicalSchemaFieldPartialEnterprise,
        source: minimalGeographicalSchemaField,
      })

      expect(result).toEqual(minimalGeographicalSchemaField)
    })
  })
})
