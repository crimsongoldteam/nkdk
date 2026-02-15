import { describe, expect, it } from "vitest"
import {
  CollectionFormElementType,
  importElementFromPartialYAML,
  importElementFromTypedYAML,
} from "~/metadata/metadataFactory"
import {
  fullPictureField,
  fullPictureFieldPartialEnterprise,
  fullPictureFieldTypedEnterprise,
  minimalPictureField,
  minimalPictureFieldPartialEnterprise,
  minimalPictureFieldTypedEnterprise,
} from "~/tests/fixtures/forms/pictureField/data"
import { mockContext } from "~/tests/mockContext"
import { PictureField } from "./types"

describe("importPictureFieldFromEnterprise", () => {
  describe("importPictureFieldTypedFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromTypedYAML<PictureField>({
        context: mockContext,
        yaml: fullPictureFieldTypedEnterprise,
        name: "ПолеКартинки",
      })

      expect(result).toEqual(fullPictureField)
    })

    it("should import minimal", () => {
      const result = importElementFromTypedYAML<PictureField>({
        context: mockContext,
        yaml: minimalPictureFieldTypedEnterprise,
        name: "ПолеКартинки",
      })

      expect(result).toEqual(minimalPictureField)
    })
  })

  describe("importPictureFieldPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: CollectionFormElementType.PictureField,
        yaml: fullPictureFieldPartialEnterprise,
        source: fullPictureField,
      })

      expect(result).toEqual(fullPictureField)
    })

    it("should import minimal", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: CollectionFormElementType.PictureField,
        yaml: minimalPictureFieldPartialEnterprise,
        source: minimalPictureField,
      })

      expect(result).toEqual(minimalPictureField)
    })
  })
})
