import { describe, expect, it } from "vitest"
import { CollectionFormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
import {
  fullPictureDecoration,
  fullPictureDecorationPartialEnterprise,
  sourcePictureDecoration,
} from "~/tests/fixtures/forms/pictureDecoration/data"
import { mockContext } from "~/tests/mockContext"

describe("importPictureDecorationFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: CollectionFormElementType.PictureDecoration,
      yaml: fullPictureDecorationPartialEnterprise,
      source: sourcePictureDecoration,
    })

    expect(result).toEqual(fullPictureDecoration)
  })

  // it("should import minimal", () => {
  //   const result = importElementFromPartialYAML({
  //     context: mockContext,
  //     itemType: CollectionFormElementType.PictureDecoration,
  //     yaml: fullPictureDecorationPartialEnterprise,
  //     source: sourcePictureDecoration,
  //   })

  //   expect(result).toEqual(minimalPictureDecoration)
  // })
})
