import { it, expect, describe } from "vitest"
import { ZElementType } from "../types"
import { TButton } from "./types"
import { formatButton } from "./format"
import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"

const configurationSettings: TConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("formatButton", () => {
  it("should format button", () => {
    const element: TButton = {
      elementType: ZElementType.enum.Button,
      name: "ИмяКнопки",
      id: "1",
      title: {
        items: { ru: "Заголовок кнопки" },
      },
    }

    const expectedResult = ["<Заголовок кнопки {ИмяКнопки}>"]

    const result = formatButton(element as TButton, configurationSettings)

    expect(result.strings).toEqual(expectedResult)
  })
})
