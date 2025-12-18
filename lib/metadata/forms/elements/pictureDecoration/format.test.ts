import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
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

    const result = formatPictureDecoration(element, mockConfigurationSettings)

    expect(result.strings).toEqual(expectedResult)
  })
})
