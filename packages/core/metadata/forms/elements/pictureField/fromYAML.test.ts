import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromPartialYAML, importElementFromYAMLTyped } from "~/metadata/metadataFactory"
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
    it("should return undefined when data is undefined", () => {
      const result = importElementFromYAMLTyped<PictureField>({
        context: mockContext,
        data: undefined,
        name: "ПолеКартинки",
      })

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importElementFromYAMLTyped<PictureField>({
        context: mockContext,
        data: fullPictureFieldTypedEnterprise,
        name: "ПолеКартинки",
      })

      expect(result).toEqual(fullPictureField)
    })

    it("should import minimal", () => {
      const result = importElementFromYAMLTyped<PictureField>({
        context: mockContext,
        data: minimalPictureFieldTypedEnterprise,
        name: "ПолеКартинки",
      })

      expect(result).toEqual(minimalPictureField)
    })
  })

  describe("importPictureFieldPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        elementType: FormElementType.PictureField,
        data: fullPictureFieldPartialEnterprise,
        source: fullPictureField,
      })

      expect(result).toEqual(fullPictureField)
    })

    it("should import minimal", () => {
      const result = importElementFromPartialYAML({
        context: mockContext,
        elementType: FormElementType.PictureField,
        data: minimalPictureFieldPartialEnterprise,
        source: minimalPictureField,
      })

      expect(result).toEqual(minimalPictureField)
    })
  })
})
