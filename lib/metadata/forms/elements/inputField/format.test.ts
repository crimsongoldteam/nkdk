import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { BaseElement } from "~/lib/metadata/forms/elements/baseElement/types"
import { FormElementType } from "../types"
import { formatInputField } from "./format"
import { InputField } from "./types"

describe("formatInputField", () => {
  it("should format input field with title", () => {
    const element: InputField = {
      name: "ИмяПоля",
      id: "1",
      elementType: FormElementType.InputField,
      title: { items: { ru: "Поле" } },
    }

    const result = formatInputField(element as BaseElement, mockConfigurationSettings)

    expect(result.strings).toEqual(["Поле: {ИмяПоля}"])
  })

  it("should format input field with value", () => {
    const element: InputField = {
      name: "ИмяПоля",
      id: "1",
      elementType: FormElementType.InputField,
      title: { items: { ru: "Поле" } },
    }
    const result = formatInputField(element as BaseElement, mockConfigurationSettings)
    expect(result.strings).toEqual(["Поле: {ИмяПоля}"])
  })

  it("should format multiline input field", () => {
    const element: InputField = {
      name: "ИмяПоля",
      id: "1",
      elementType: FormElementType.InputField,
      title: { items: { ru: "Поле" } },
      height: 2,
      multiLine: true,
    }

    const result = formatInputField(element as BaseElement, mockConfigurationSettings)

    expect(result.strings).toEqual(["Поле: {ИмяПоля}", "      "])
  })

  it("should format input field with modificators", () => {
    const element: InputField = {
      name: "ИмяПоля",
      id: "1",
      elementType: FormElementType.InputField,
      title: { items: { ru: "Поле" } },
      choiceButton: true,
      dropListButton: true,
      clearButton: true,
      openButton: true,
      spinButton: true,
    }

    const result = formatInputField(element as BaseElement, mockConfigurationSettings)

    expect(result.strings).toEqual(["Поле: __ВСХОД {ИмяПоля}"])
  })

  it("should format input field with name if title is not present", () => {
    const element: InputField = {
      name: "ИмяПоля",
      id: "1",
      elementType: FormElementType.InputField,
    }

    const result = formatInputField(element as BaseElement, mockConfigurationSettings)

    expect(result.strings).toEqual(["{ИмяПоля}: "])
  })
})
