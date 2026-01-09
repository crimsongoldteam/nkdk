import { describe, expect, it } from "vitest"
import { mockСontext } from "~/tests/mockContext"
import { FormElementType } from "../../../metadataFactory/types"
import { exportPictureDecorationToStructure } from "./exportToStructure"
import { PictureDecoration } from "./types"

describe("exportPictureDecorationToStructure", () => {
  it("should format picture decoration", () => {
    const element: PictureDecoration = {
      elementType: FormElementType.PictureDecoration,
      picture: {
        ref: "Печать",
        type: "CommonPicture",
        loadTransparent: false,
      },
      name: "ИмяПоля",
    }

    const expectedResult = ["@Печать {ИмяПоля}"]

    const result = exportPictureDecorationToStructure(mockСontext, element)

    expect(result.strings).toEqual(expectedResult)
  })
})
