import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromYAMLPartial, importElementFromYAMLTyped } from "~/metadata/metadataFactory"
import {
  fullPopup,
  fullPopupPartialEnterprise,
  fullPopupTypedEnterprise,
  minimalPopup,
  minimalPopupPartialEnterprise,
  minimalPopupTypedEnterprise,
} from "~/tests/fixtures/forms/popup/data"
import { mockContext } from "~/tests/mockContext"
import { Popup } from "./types"

describe("importPopupFromEnterprise", () => {
  describe("importPopupTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importElementFromYAMLTyped<Popup>({
        context: mockContext,
        data: undefined,
        name: "ВсплывающаяФорма",
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLTyped<Popup>({
        context: mockContext,
        data: fullPopupTypedEnterprise,
        name: "ВсплывающаяФорма",
      })

      expect(result).toEqual(fullPopup)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLTyped<Popup>({
        context: mockContext,
        data: minimalPopupTypedEnterprise,
        name: "ВсплывающаяФорма",
      })

      expect(result).toEqual(minimalPopup)
    })
  })

  describe("importPopupPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.Popup,
        data: fullPopupPartialEnterprise,
        source: fullPopup,
      })

      expect(result).toEqual(fullPopup)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.Popup,
        data: minimalPopupPartialEnterprise,
        source: fullPopup,
      })

      expect(result).toEqual(minimalPopup)
    })
  })
})
