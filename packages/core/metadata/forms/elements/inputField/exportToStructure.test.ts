import { describe, expect, it } from "vitest"
import { mockСontext } from "~/tests/mockContext"
import { FormElementType } from "../../../metadataFactory/types"
import { exportInputFieldToStructure } from "./exportToStructure"
import { InputField } from "./types"

describe("exportInputFieldToStructure", () => {
  it("should export input field with title", () => {
    const element: InputField = {
      name: "ИмяПоля",
      id: "1",
      elementType: FormElementType.InputField,
      title: { items: { ru: "Поле" } },
    }

    const result = exportInputFieldToStructure(mockСontext, element)

    expect(result.strings).toEqual(["Поле: {ИмяПоля}"])
  })

  it("should format input field with value", () => {
    const element: InputField = {
      name: "ИмяПоля",
      id: "1",
      elementType: FormElementType.InputField,
      title: { items: { ru: "Поле" } },
    }
    const result = exportInputFieldToStructure(mockСontext, element)
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

    const result = exportInputFieldToStructure(mockСontext, element)

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

    const result = exportInputFieldToStructure(mockСontext, element)

    expect(result.strings).toEqual(["Поле: __ВСХОД {ИмяПоля}"])
  })

  it("should format input field with name if title is not present", () => {
    const element: InputField = {
      name: "ИмяПоля",
      id: "1",
      elementType: FormElementType.InputField,
    }

    const result = exportInputFieldToStructure(mockСontext, element)

    expect(result.strings).toEqual(["{ИмяПоля}: "])
  })
})
