import { describe, expect, it } from "vitest"
import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { FormElementType } from "../types"
import { formatInputField } from "./format"
import { InputField } from "./types"

const configurationSettings: TConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("formatInputField", () => {
  it("should format input field with title", () => {
    const element: InputField = {
      name: "ИмяПоля",
      id: "1",
      elementType: FormElementType.InputField,
      title: { items: { ru: "Поле" } },
      value: "Значение",
    }

    const result = formatInputField(element, configurationSettings)

    expect(result.strings).toEqual(["Поле: Значение {ИмяПоля}"])
  })

  it("should format input field with value", () => {
    const element: InputField = {
      name: "ИмяПоля",
      id: "1",
      elementType: FormElementType.InputField,
      title: { items: { ru: "Поле" } },
      value: "Значение",
    }
    const result = formatInputField(element, configurationSettings)
    expect(result.strings).toEqual(["Поле: Значение {ИмяПоля}"])
  })

  it("should format multiline input field", () => {
    const element: InputField = {
      name: "ИмяПоля",
      id: "1",
      elementType: FormElementType.InputField,
      title: { items: { ru: "Поле" } },
      value: "Значение",
      height: 2,
      multiLine: true,
    }

    const result = formatInputField(element, configurationSettings)

    expect(result.strings).toEqual(["Поле: Значение {ИмяПоля}", "      ________"])
  })

  it("should format input field with modificators", () => {
    const element: InputField = {
      name: "ИмяПоля",
      id: "1",
      elementType: FormElementType.InputField,
      title: { items: { ru: "Поле" } },
      value: "Значение",
      choiceButton: true,
      dropListButton: true,
      clearButton: true,
      openButton: true,
      spinButton: true,
    }

    const result = formatInputField(element, configurationSettings)

    expect(result.strings).toEqual(["Поле: Значение__ВСХОД {ИмяПоля}"])
  })

  it("should format input field with name if title is not present", () => {
    const element: InputField = {
      name: "ИмяПоля",
      id: "1",
      elementType: FormElementType.InputField,
    }

    const result = formatInputField(element, configurationSettings)

    expect(result.strings).toEqual(["{ИмяПоля}: "])
  })
})
