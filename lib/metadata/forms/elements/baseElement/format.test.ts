import { describe, expect, it } from "vitest"
import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { formatOtherElement } from "./format"
import { BaseElement } from "./types"
import { FormElementType } from "../types"

const configurationSettings: TConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("formatOtherElement", () => {
  it("should format element", () => {
    const element: BaseElement = {
      elementType: FormElementType.InputField,
      name: "ИмяПоля",
      id: "1",
    }

    const expectedResult = ["?InputField {ИмяПоля}"]

    const result = formatOtherElement(element, configurationSettings)

    expect(result.strings).toEqual(expectedResult)
  })
})
