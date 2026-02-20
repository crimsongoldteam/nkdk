import { describe, expect, it } from "vitest"
import {
  CollectionFormElementType,
  importElementFromPartialYAML,
  importElementFromTypedYAML,
} from "~/metadata/metadataFactory"
import {
  fullPictureField,
  fullPictureFieldPartialYAML,
  fullPictureFieldTypedYAML,
  minimalPictureField,
  minimalPictureFieldPartialYAML,
  minimalPictureFieldTypedYAML,
} from "~/tests/fixtures/forms/pictureField/data"
import { mockContext } from "~/tests/mockContext"
import { PictureField } from "./types"

describe("importPictureFieldFromYAML", () => {
  describe("importPictureFieldTypedFromYAML", () => {
    it("should import all fields from YAML", () => {
      const result = importElementFromTypedYAML<PictureField>({
        context: mockContext,
        yaml: fullPictureFieldTypedYAML,
        name: "ПолеКартинки",
      })

      expect(result).toEqual(fullPictureField)
    })

    it("should import minimal", () => {
      const result = importElementFromTypedYAML<PictureField>({
        context: mockContext,
        yaml: minimalPictureFieldTypedYAML,
        name: "ПолеКартинки",
      })

      expect(result).toEqual(minimalPictureField)
    })
  })

  describe("importPictureFieldPartialFromYAML", () => {
    it("should import all fields from YAML", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: CollectionFormElementType.PictureField,
        yaml: fullPictureFieldPartialYAML,
        source: fullPictureField,
      })

      expect(result).toEqual(fullPictureField)
    })

    it("should import minimal", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        itemType: CollectionFormElementType.PictureField,
        yaml: minimalPictureFieldPartialYAML,
        source: minimalPictureField,
      })

      expect(result).toEqual(minimalPictureField)
    })
  })
})
