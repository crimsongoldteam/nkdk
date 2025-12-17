import { it, expect, describe } from "vitest"
import { FormElementType } from "../types"
import { PictureDecoration } from "./types"
import { formatPictureDecoration } from "./format"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"

const configurationSettings: ConfigurationSettings = {
  defaultLanguage: "ru",
}

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

    const result = formatPictureDecoration(element, configurationSettings)

    expect(result.strings).toEqual(expectedResult)
  })
})
