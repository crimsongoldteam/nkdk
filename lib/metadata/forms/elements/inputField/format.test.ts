import { expect, it } from "vitest"
import { IFormatterParams, WrapInGroupStrategy } from "~/lib/format/types"
import { TInputField } from "./types"
import { formatInputField } from "./format"
import { ZElementType } from "../types"

const mockParams: IFormatterParams = {
  wrapInGroup: WrapInGroupStrategy.None,
  level: 0,
  isFirst: true,
}

it("should format input field with title", () => {
  const element: TInputField = {
    name: "ИмяПоля",
    id: "1",
    elementType: ZElementType.enum.InputField,
    title: { items: { ru: "Поле" } },
    value: "Значение",
  }

  const result = formatInputField(element, mockParams)

  expect(result).toEqual(["Поле: Значение {ИмяПоля}"])
})

it("should format input field with value", () => {
  const element: TInputField = {
    name: "ИмяПоля",
    id: "1",
    elementType: ZElementType.enum.InputField,
    title: { items: { ru: "Поле" } },
    value: "Значение",
  }
  const result = formatInputField(element, mockParams)
  expect(result).toEqual(["Поле: Значение {ИмяПоля}"])
})

it("should format multiline input field", () => {
  const element: TInputField = {
    name: "ИмяПоля",
    id: "1",
    elementType: ZElementType.enum.InputField,
    title: { items: { ru: "Поле" } },
    value: "Значение",
    height: 2,
    multiLine: true,
  }

  const result = formatInputField(element, mockParams)

  expect(result).toEqual(["Поле: Значение {ИмяПоля}", "      ________"])
})

it("should format input field with modificators", () => {
  const element: TInputField = {
    name: "ИмяПоля",
    id: "1",
    elementType: ZElementType.enum.InputField,
    title: { items: { ru: "Поле" } },
    value: "Значение",
    choiceButton: true,
    dropListButton: true,
    clearButton: true,
    openButton: true,
    spinButton: true,
  }

  const result = formatInputField(element, mockParams)

  expect(result).toEqual(["Поле: Значение__ВСХОД {ИмяПоля}"])
})

it("should format input field with name if title is not present", () => {
  const element: TInputField = {
    name: "ИмяПоля",
    id: "1",
    elementType: ZElementType.enum.InputField,
  }

  const result = formatInputField(element, mockParams)

  expect(result).toEqual(["ИмяПоля: {ИмяПоля}"])
})
