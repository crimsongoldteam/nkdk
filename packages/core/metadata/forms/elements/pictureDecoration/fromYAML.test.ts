import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromYAMLPartial, importElementFromYAMLTyped } from "~/metadata/metadataFactory"
import {
  fullPictureDecoration,
  fullPictureDecorationPartialEnterprise,
  fullPictureDecorationTypedEnterprise,
  minimalPictureDecoration,
  minimalPictureDecorationTypedEnterprise,
} from "~/tests/fixtures/forms/pictureDecoration/data"
import { mockContext } from "~/tests/mockContext"
import { PictureDecoration } from "./types"

describe("importPictureDecorationFromEnterprise", () => {
  describe("importPictureDecorationTypedFromEnterprise", () => {
    it("should return undefined when data is undefined", () => {
      const result = importElementFromYAMLTyped({
        context: mockContext,
        data: undefined,
        name: "ДекорацияКартинки",
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLTyped<PictureDecoration>({
        context: mockContext,
        data: fullPictureDecorationTypedEnterprise,
        name: "ДекорацияКартинки",
      })

      expect(result).toEqual(fullPictureDecoration)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLTyped<PictureDecoration>({
        context: mockContext,
        data: minimalPictureDecorationTypedEnterprise,
        name: "ДекорацияКартинки",
      })

      expect(result).toEqual(minimalPictureDecoration)
    })
  })

  describe("importPictureDecorationPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.PictureDecoration,
        data: fullPictureDecorationPartialEnterprise,
        source: fullPictureDecoration,
      })

      expect(result).toEqual(fullPictureDecoration)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLPartial({
        context: mockContext,
        elementType: FormElementType.PictureDecoration,
        data: fullPictureDecorationPartialEnterprise,
        source: fullPictureDecoration,
      })

      expect(result).toEqual(minimalPictureDecoration)
    })
  })
})
