import { describe, expect, it } from "vitest"
import { exportElementToPartialYAML, exportPropertyToYAML } from "~/metadata/metadataFactory"
import { PropertyRule } from "~/metadata/metadataFactory/properties/types"
import {
  fullSearchStringAddition,
  fullSearchStringAdditionEnterprise,
  fullSingleSearchStringAddition,
  fullSingleSearchStringAdditionEnterprise,
  minimalSearchStringAddition,
} from "~/tests/fixtures/forms/searchStringAddition/data"
import { mockContext } from "~/tests/mockContext"
import { Table } from "../table/types"

const rule: PropertyRule<Table> = {
  type: "SearchStringAddition",
  yaml: "ОтображениеСтрокиПоиска",
}
describe("SearchStringAddition to YAML", () => {
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
        value: fullSingleSearchStringAddition,
      })

      expect(result).toHaveProperty("ОтображениеСтрокиПоиска", fullSingleSearchStringAdditionEnterprise)
    })
  })

  describe("Partial to YAML", () => {
    it("should export all fields to Enterprise", () => {
      const result = exportElementToPartialYAML({
        context: mockContext,
        element: fullSearchStringAddition,
      })

      expect(result).toEqual(fullSearchStringAdditionEnterprise)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalSearchStringAddition })

      expect(result).toBeUndefined()
    })
  })
})
