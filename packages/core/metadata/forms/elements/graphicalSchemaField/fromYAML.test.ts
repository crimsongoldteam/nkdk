import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromYAMLPartial, importElementFromYAMLTyped } from "~/metadata/metadataFactory"
import {
  fullGraphicalSchemaField,
  fullGraphicalSchemaFieldPartialEnterprise,
  fullGraphicalSchemaFieldTypedEnterprise,
  minimalGraphicalSchemaField,
  minimalGraphicalSchemaFieldPartialEnterprise,
  minimalGraphicalSchemaFieldTypedEnterprise,
} from "~/tests/fixtures/forms/graphicalSchemaField/data"
import { mockContext } from "~/tests/mockContext"
import { GraphicalSchemaField } from "./types"

describe("importGraphicalSchemaFieldFromEnterprise", () => {
  describe("importGraphicalSchemaFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importElementFromYAMLTyped<GraphicalSchemaField>({
        context: mockContext,
        data: undefined,
        name: "ПолеГрафическойСхемы",
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLTyped<GraphicalSchemaField>({
        context: mockContext,
        data: fullGraphicalSchemaFieldTypedEnterprise,
        name: "ПолеГрафическойСхемы",
      })

      expect(result).toEqual(fullGraphicalSchemaField)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLTyped<GraphicalSchemaField>({
        context: mockContext,
        data: minimalGraphicalSchemaFieldTypedEnterprise,
        name: "ПолеГрафическойСхемы",
      })

      expect(result).toEqual(minimalGraphicalSchemaField)
    })
  })

  describe("importGraphicalSchemaFieldPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.GraphicalSchemaField,
        data: fullGraphicalSchemaFieldPartialEnterprise,
        source: fullGraphicalSchemaField,
      })

      expect(result).toEqual(fullGraphicalSchemaField)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.GraphicalSchemaField,
        data: minimalGraphicalSchemaFieldPartialEnterprise,
        source: minimalGraphicalSchemaField,
      })

      expect(result).toEqual(minimalGraphicalSchemaField)
    })
  })
})
