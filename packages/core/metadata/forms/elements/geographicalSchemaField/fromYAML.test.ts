import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromYAMLPartial, importElementFromYAMLTyped } from "~/metadata/metadataFactory"
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
      const result = importElementFromYAMLTyped<GeographicalSchemaField>({
        context: mockContext,
        data: undefined,
        name: "ПолеГеографическойСхемы",
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLTyped<GeographicalSchemaField>({
        context: mockContext,
        data: fullGeographicalSchemaFieldTypedEnterprise,
        name: "ПолеГеографическойСхемы",
      })

      expect(result).toEqual(fullGeographicalSchemaField)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLTyped<GeographicalSchemaField>({
        context: mockContext,
        data: minimalGeographicalSchemaFieldTypedEnterprise,
        name: "ПолеГеографическойСхемы",
      })

      expect(result).toEqual(minimalGeographicalSchemaField)
    })
  })

  describe("importGeographicalSchemaFieldPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.GeographicalSchemaField,
        data: fullGeographicalSchemaFieldPartialEnterprise,
        source: fullGeographicalSchemaField,
      })

      expect(result).toEqual(fullGeographicalSchemaField)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.GeographicalSchemaField,
        data: minimalGeographicalSchemaFieldPartialEnterprise,
        source: minimalGeographicalSchemaField,
      })

      expect(result).toEqual(minimalGeographicalSchemaField)
    })
  })
})
