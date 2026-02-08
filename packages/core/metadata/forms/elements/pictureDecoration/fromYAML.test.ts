import { describe, expect, it } from "vitest"
import { FormElementType, importElementFromYAMLPartial } from "~/metadata/metadataFactory"
import {
  fullPictureDecoration,
  fullPictureDecorationPartialEnterprise,
  minimalPictureDecoration,
} from "~/tests/fixtures/forms/pictureDecoration/data"
import { mockContext } from "~/tests/mockContext"

describe("importPictureDecorationFromEnterprise", () => {
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
