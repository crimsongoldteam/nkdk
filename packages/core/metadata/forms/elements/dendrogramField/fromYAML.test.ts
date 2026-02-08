import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromYAMLPartial, importElementFromYAMLTyped } from "~/metadata/metadataFactory"
import {
  fullDendrogramField,
  fullDendrogramFieldPartialEnterprise,
  fullDendrogramFieldTypedEnterprise,
  minimalDendrogramField,
  minimalDendrogramFieldPartialEnterprise,
  minimalDendrogramFieldTypedEnterprise,
} from "~/tests/fixtures/forms/dendrogramField/data"
import { mockContext } from "~/tests/mockContext"
import { DendrogramField } from "./types"

describe("importDendrogramFieldFromEnterprise", () => {
  describe("importDendrogramFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importElementFromYAMLTyped<DendrogramField>({
        context: mockContext,
        data: undefined,
        name: "ПолеДиаграммыГанта",
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLTyped<DendrogramField>({
        context: mockContext,
        data: fullDendrogramFieldTypedEnterprise,
        name: "ПолеДиаграммыГанта",
      })

      expect(result).toEqual(fullDendrogramField)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLTyped<DendrogramField>({
        context: mockContext,
        data: minimalDendrogramFieldTypedEnterprise,
        name: "ПолеДиаграммыГанта",
      })

      expect(result).toEqual(minimalDendrogramField)
    })
  })

  describe("importDendrogramFieldPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.DendrogramField,
        data: fullDendrogramFieldPartialEnterprise,
        source: fullDendrogramField,
      })

      expect(result).toEqual(fullDendrogramField)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.DendrogramField,
        data: minimalDendrogramFieldPartialEnterprise,
        source: minimalDendrogramField,
      })

      expect(result).toEqual(minimalDendrogramField)
    })
  })
})
