import { describe, expect, it } from "vitest"
import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { FormElementType } from "../types"
import { formatButton } from "./format"
import { Button } from "./types"

const configurationSettings: TConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("formatButton", () => {
  it("should format button", () => {
    const element: Button = {
      elementType: FormElementType.Button,
      name: "ИмяКнопки",
      id: "1",
      title: {
        items: { ru: "Заголовок кнопки" },
      },
    }

    const expectedResult = ["<Заголовок кнопки {ИмяКнопки}>"]

    const result = formatButton(element, configurationSettings)

    expect(result.strings).toEqual(expectedResult)
  })
})
