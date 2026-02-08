import result from "antd/es/result"
import { describe, expect, it } from "vitest"
import { importElementFromYAMLPartial } from "~/metadata/metadataFactory"
import {
  fullCheckBoxField,
  fullCheckBoxFieldPartialEnterprise,
  fullCheckBoxFieldTypedEnterprise,
  minimalCheckBoxField,
  minimalCheckBoxFieldPartialEnterprise,
  minimalCheckBoxFieldTypedEnterprise,
} from "~/tests/fixtures/forms/checkBoxField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import {
  importCheckBoxFieldPartialFromEnterprise,
  importCheckBoxFieldTypedFromEnterprise,
} from "./importFromEnterprise"

describe("importCheckBoxFieldFromEnterprise", () => {
  describe("importCheckBoxFieldTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      importCheckBoxFieldTypedFromEnterprise(mockContext, mockRule, undefined, "Флажок")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importCheckBoxFieldTypedFromEnterprise(
        mockContext,
        mockRule,
        fullCheckBoxFieldTypedEnterprise,
        "Флажок"
      )

      expect(result).toEqual(fullCheckBoxField)
    })

    it("should import minimal", () => {
      const result = importCheckBoxFieldTypedFromEnterprise(
        mockContext,
        mockRule,
        minimalCheckBoxFieldTypedEnterprise,
        "Флажок"
      )

      expect(result).toEqual(minimalCheckBoxField)
    })
  })

  describe("importCheckBoxFieldPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: "CheckBoxField",
        data: fullCheckBoxFieldPartialEnterprise,
        source: fullCheckBoxField,
      })

      expect(result).toEqual(fullCheckBoxField)
    })

    it("should import minimal", () => {
      const result = importCheckBoxFieldPartialFromEnterprise(
        mockContext,
        mockRule,
        minimalCheckBoxField,
        minimalCheckBoxFieldPartialEnterprise
      )

      expect(result).toEqual(minimalCheckBoxField)
    })
  })
})
