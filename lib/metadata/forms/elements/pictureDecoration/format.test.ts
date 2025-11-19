import { it, expect, describe } from "vitest"
import { ZElementType } from "../types"
import { TPictureDecoration } from "./types"
import { formatPictureDecoration } from "./format"
import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"

const configurationSettings: TConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("formatPictureDecoration", () => {
  it("should format picture decoration", () => {
    const element: TPictureDecoration = {
      elementType: ZElementType.enum.PictureDecoration,
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
