import { expect, it } from "vitest"
import { IFormatterParams } from "~/lib/formatter/types"
import { WrapInGroupStrategy } from "~/lib/metadata/forms/interfaces"
import { TInputField } from "./types"
import { formatInputField } from "./format"

const mockParams: IFormatterParams = {
  wrapInGroup: WrapInGroupStrategy.None,
  level: 0,
  isFirst: true,
}

it("should format input field with title", () => {
  const element: TInputField = {
    title: { ru: "Поле" },
    value: "Значение",
  }

  const result = formatInputField(element, mockParams)

  expect(result).toEqual(["Поле: Значение"])
})

it("should format input field with value", () => {
  const element: TInputField = {
    title: { ru: "Поле" },
    value: "Значение",
  }
  const result = formatInputField(element, mockParams)
  expect(result).toEqual(["Поле: Значение"])
})

it("should format input field without title", () => {
  const element: TInputField = {
    value: "Значение",
  }

  const result = formatInputField(element, mockParams)

  expect(result).toEqual([": Значение"])
})

it("should format multiline input field", () => {
  const element: TInputField = {
    title: { ru: "Поле" },
    value: "Значение",
    height: 2,
    isMultiline: true,
  }

  const result = formatInputField(element, mockParams)

  expect(result).toEqual(["Поле: Значение", "      ________"])
})

it("should format input field with modificators", () => {
  const element: TInputField = {
    title: { ru: "Поле" },
    value: "Значение",
    choiceButton: true,
    dropListButton: true,
    clearButton: true,
    openButton: true,
    spinButton: true,
  }

  const result = formatInputField(element, mockParams)

  expect(result).toEqual(["Поле: Значение__ВСХОД"])
})
