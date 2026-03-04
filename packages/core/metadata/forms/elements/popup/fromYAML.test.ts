import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML, importElementFromTypedYAML } from "~/metadata/metadataFactory"
import {
  fullPopup,
  fullPopupPartialYAML,
  fullPopupTypedYAML,
  minimalPopup,
  minimalPopupTypedYAML,
  sourcePopup,
} from "~/tests/fixtures/forms/popup/data"
import { mockContext } from "~/tests/mockContext"
import { Popup } from "./types"

describe("Popup from YAML", () => {
  describe("Typed", () => {
    it("should import all fields from YAML", () => {
      const result = importElementFromTypedYAML<Popup>({
        context: mockContext,
        yaml: fullPopupTypedYAML,
        name: "Подменю",
      })

      expect(result).toEqual(fullPopup)
    })

    it("should import minimal", () => {
      const result = importElementFromTypedYAML<Popup>({
        context: mockContext,
        yaml: minimalPopupTypedYAML,
        name: "Подменю",
      })

      expect(result).toEqual(minimalPopup)
    })
  })

  describe("Partial", () => {
    it("should import all fields from YAML", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: "Popup",
        yaml: fullPopupPartialYAML,
        source: sourcePopup,
      })

      expect(result).toEqual(fullPopup)
    })

    // it("should import minimal", () => {
    //   const result = importElementFromPartialYAML({
    //     context: mockContext,
    //     itemType: "Popup",
    //     yaml: minimalPopupPartialYAML,
    //     source: sourcePopup,
    //   })

    //   expect(result).toEqual(minimalPopup)
    // })
  })
})
