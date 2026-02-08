import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromPartialYAML, importElementFromTypedYAML } from "~/metadata/metadataFactory"
import {
  fullGeographicalSchemaField,
  fullGeographicalSchemaFieldPartialEnterprise,
  fullGeographicalSchemaFieldTypedEnterprise,
  minimalGeographicalSchemaField,
  minimalGeographicalSchemaFieldPartialEnterprise,
  minimalGeographicalSchemaFieldTypedEnterprise,
} from "~/tests/fixtures/forms/geographicalSchemaField/data"
import { mockContext } from "~/tests/mockContext"
import { GeographicalSchemaField } from "./types"

describe("importGeographicalSchemaFieldFromEnterprise", () => {
  describe("importGeographicalSchemaFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importElementFromTypedYAML<GeographicalSchemaField>({
        context: mockContext,
        yaml: undefined,
        name: "ПолеГеографическойСхемы",
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importElementFromTypedYAML<GeographicalSchemaField>({
        context: mockContext,
        yaml: fullGeographicalSchemaFieldTypedEnterprise,
        name: "ПолеГеографическойСхемы",
      })

      expect(result).toEqual(fullGeographicalSchemaField)
    })

    it("should import minimal", () => {
      const result = importElementFromTypedYAML<GeographicalSchemaField>({
        context: mockContext,
        yaml: minimalGeographicalSchemaFieldTypedEnterprise,
        name: "ПолеГеографическойСхемы",
      })

      expect(result).toEqual(minimalGeographicalSchemaField)
    })
  })

  describe("importGeographicalSchemaFieldPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        elementType: FormElementType.GeographicalSchemaField,
        yaml: fullGeographicalSchemaFieldPartialEnterprise,
        source: fullGeographicalSchemaField,
      })

      expect(result).toEqual(fullGeographicalSchemaField)
    })

    it("should import minimal", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        elementType: FormElementType.GeographicalSchemaField,
        yaml: minimalGeographicalSchemaFieldPartialEnterprise,
        source: minimalGeographicalSchemaField,
      })

      expect(result).toEqual(minimalGeographicalSchemaField)
    })
  })
})
