import { describe, expect, it } from "vitest"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { FormElementType } from "../types"
import { formatOtherElement } from "./format"
import { BaseElement } from "./types"

const configurationSettings: ConfigurationSettings = {
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
