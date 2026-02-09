import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML, exportPropertyToYAML } from "~/metadata/metadataFactory"
import { PropertyRule } from "~/metadata/metadataFactory/elementRulesFactory"
import {
  fullSearchControlAddition,
  fullSearchControlAdditionEnterprise,
  fullSingleSearchControlAddition,
  fullSingleSearchControlAdditionEnterprise,
  minimalSearchControlAddition,
} from "~/tests/fixtures/forms/searchControlAddition/data"
import { mockContext } from "~/tests/mockContext"
import { Table } from "../table/types"

const rule: PropertyRule<Table> = {
  type: "SearchStringAddition",
  yaml: "УправлениеПоиском",
}

describe("SearchControlAddition to YAML", () => {
  describe("Single", () => {
    it("should return undefined when data is undefined", () => {
      const result = exportPropertyToYAML({
        context: mockContext,
        rule: rule,
        value: undefined,
      })

      expect(result).toBeUndefined()
    })

    it("should full", () => {
      const result = exportPropertyToYAML({
        context: mockContext,
        rule: rule,
        value: fullSingleSearchControlAddition,
      })

      expect(result).toHaveProperty("УправлениеПоиском", fullSingleSearchControlAdditionEnterprise)
    })
  })

  describe("Partial to YAML", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToPartialYAML({
        context: mockContext,
        element: fullSearchControlAddition,
      })

      expect(result).toEqual(fullSearchControlAdditionEnterprise)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalSearchControlAddition })

      expect(result).toBeUndefined()
    })
  })
})
