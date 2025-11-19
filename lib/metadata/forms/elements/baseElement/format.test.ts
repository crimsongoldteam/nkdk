import { it, expect, describe } from "vitest"
import { ZElementType } from "../types"
import { TBaseElement } from "./types"
import { formatOtherElement } from "./format"
import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"

const configurationSettings: TConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("formatOtherElement", () => {
  it("should format element", () => {
    const element: TBaseElement = {
      elementType: ZElementType.enum.InputField,
      name: "ИмяПоля",
      id: "1",
    }

    const expectedResult = ["?InputField {ИмяПоля}"]

    const result = formatOtherElement(element, configurationSettings)

    expect(result.strings).toEqual(expectedResult)
  })
})
