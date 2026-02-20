import { describe, expect, it } from "vitest"
import { CollectionFormElementType, importElementFromPartialYAML } from "~/metadata/metadataFactory"
import {
  fullPictureDecoration,
  fullPictureDecorationPartialYAML,
  sourcePictureDecoration,
} from "~/tests/fixtures/forms/pictureDecoration/data"
import { mockContext } from "~/tests/mockContext"

describe("importPictureDecorationFromYAML", () => {
  it("should import all fields from YAML", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: CollectionFormElementType.PictureDecoration,
      yaml: fullPictureDecorationPartialYAML,
      source: sourcePictureDecoration,
    })

    expect(result).toEqual(fullPictureDecoration)
  })

  // it("should import minimal", () => {
  //   const result = importElementFromPartialYAML({
  //     context: mockContext,
  //     itemType: CollectionFormElementType.PictureDecoration,
  //     yaml: fullPictureDecorationPartialYAML,
  //     source: sourcePictureDecoration,
  //   })

  //   expect(result).toEqual(minimalPictureDecoration)
  // })
})
