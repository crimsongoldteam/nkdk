import { describe, expect, it } from "vitest"
import { mockcontext } from "~/lib/tests/mockContext"
import { FormElementType } from "../../../metadataFactory/types"
import { formatPictureDecoration } from "./format"
import { PictureDecoration } from "./types"

describe("formatPictureDecoration", () => {
  it("should format picture decoration", () => {
    const element: PictureDecoration = {
      elementType: FormElementType.PictureDecoration,
      picture: {
        ref: "Печать",
        type: "CommonPicture",
        loadTransparent: false,
      },
      name: "ИмяПоля",
      id: "1",
    }

    const expectedResult = ["@Печать {ИмяПоля}"]

    const result = formatPictureDecoration(element, mockcontext)

    expect(result.strings).toEqual(expectedResult)
  })
})
