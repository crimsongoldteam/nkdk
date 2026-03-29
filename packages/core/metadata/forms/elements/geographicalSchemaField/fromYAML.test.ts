import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML } from "~/metadata/orchestration"
import {
  fullGeographicalSchemaField,
  fullGeographicalSchemaFieldPartialYAML,
  minimalGeographicalSchemaField,
  minimalGeographicalSchemaFieldPartialYAML,
} from "~/metadata/forms/elements/geographicalSchemaField/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"

describe("importGeographicalSchemaFieldFromYAML", () => {
  describe("importGeographicalSchemaFieldPartialFromYAML", () => {
    it("should import all fields from YAML", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: "GeographicalSchemaField",
        yaml: fullGeographicalSchemaFieldPartialYAML,
        source: fullGeographicalSchemaField,
      })

      expect(result).toEqual(fullGeographicalSchemaField)
    })

    it("should import minimal", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: "GeographicalSchemaField",
        yaml: minimalGeographicalSchemaFieldPartialYAML,
        source: minimalGeographicalSchemaField,
      })

      expect(result).toEqual(minimalGeographicalSchemaField)
    })
  })
})
