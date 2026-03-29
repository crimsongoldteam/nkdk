import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML } from "~/metadata/orchestration"
import {
  fullPictureDecoration,
  fullPictureDecorationPartialYAML,
  sourcePictureDecoration,
} from "~/metadata/forms/elements/pictureDecoration/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"

describe("importPictureDecorationFromYAML", () => {
  it("should import all fields from YAML", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: "PictureDecoration",
      yaml: fullPictureDecorationPartialYAML,
      source: sourcePictureDecoration,
    })

    expect(result).toEqual(fullPictureDecoration)
  })

  // it("should import minimal", () => {
  //   const result = importElementFromPartialYAML({
  //     context: mockContext,
  //     itemType: "PictureDecoration",
  //     yaml: fullPictureDecorationPartialYAML,
  //     source: sourcePictureDecoration,
  //   })

  //   expect(result).toEqual(minimalPictureDecoration)
  // })
})
