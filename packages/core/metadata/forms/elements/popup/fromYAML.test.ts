import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromPartialYAML, importElementFromTypedYAML } from "~/metadata/metadataFactory"
import {
  fullPopup,
  fullPopupPartialEnterprise,
  fullPopupTypedEnterprise,
  minimalPopup,
  minimalPopupTypedEnterprise,
  sourcePopup,
} from "~/tests/fixtures/forms/popup/data"
import { mockContext } from "~/tests/mockContext"
import { Popup } from "./types"

describe("Popup from YAML", () => {
  describe("Typed", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromTypedYAML<Popup>({
        context: mockContext,
        yaml: fullPopupTypedEnterprise,
        name: "Подменю",
      })

      expect(result).toEqual(fullPopup)
    })

    it("should import minimal", () => {
      const result = importElementFromTypedYAML<Popup>({
        context: mockContext,
        yaml: minimalPopupTypedEnterprise,
        name: "Подменю",
      })

      expect(result).toEqual(minimalPopup)
    })
  })

  describe("Partial", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: FormElementType.Popup,
        yaml: fullPopupPartialEnterprise,
        source: sourcePopup,
      })

      expect(result).toEqual(fullPopup)
    })

    // it("should import minimal", () => {
    //   const result = importElementFromPartialYAML({
    //     context: mockContext,
    //     itemType: FormElementType.Popup,
    //     yaml: minimalPopupPartialEnterprise,
    //     source: sourcePopup,
    //   })

    //   expect(result).toEqual(minimalPopup)
    // })
  })
})
