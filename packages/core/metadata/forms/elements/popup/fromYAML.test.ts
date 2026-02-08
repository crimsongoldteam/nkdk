import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromPartialYAML, importElementFromTypedYAML } from "~/metadata/metadataFactory"
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
      const result = importElementFromTypedYAML<Popup>({
        context: mockContext,
        yaml: undefined,
        name: "ВсплывающаяФорма",
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importElementFromTypedYAML<Popup>({
        context: mockContext,
        yaml: fullPopupTypedEnterprise,
        name: "ВсплывающаяФорма",
      })

      expect(result).toEqual(fullPopup)
    })

    it("should import minimal", () => {
      const result = importElementFromTypedYAML<Popup>({
        context: mockContext,
        yaml: minimalPopupTypedEnterprise,
        name: "ВсплывающаяФорма",
      })

      expect(result).toEqual(minimalPopup)
    })
  })

  describe("importPopupPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        elementType: FormElementType.Popup,
        yaml: fullPopupPartialEnterprise,
        source: fullPopup,
      })

      expect(result).toEqual(fullPopup)
    })

    it("should import minimal", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        elementType: FormElementType.Popup,
        yaml: minimalPopupPartialEnterprise,
        source: fullPopup,
      })

      expect(result).toEqual(minimalPopup)
    })
  })
})
