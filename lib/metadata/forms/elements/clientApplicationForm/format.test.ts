import { expect, it } from "vitest"
import { IFormatterParams, WrapInGroupStrategy } from "~/lib/format/types"
import { formatClientApplicationForm } from "./format"
import { TClientApplicationForm, TInputField } from "~/lib"
import { ZElementType } from "../types"

const mockParams: IFormatterParams = {
  wrapInGroup: WrapInGroupStrategy.None,
  level: 0,
  isFirst: true,
}

it("should format form header", () => {
  const form: TClientApplicationForm = {
    elementType: ZElementType.enum.Form,
    title: { ru: "Форма" },
    childItems: [],
  }

  const result = formatClientApplicationForm(form, mockParams)

  expect(result).toEqual(["--- Форма ---"])
})

it("should format form items", () => {
  const input: TInputField = {
    name: "ИмяПоля",
    id: "1",
    elementType: ZElementType.enum.InputField,
    title: { ru: "Поле" },
  }

  const form: TClientApplicationForm = {
    elementType: ZElementType.enum.Form,
    childItems: [input],
  }

  const result = formatClientApplicationForm(form, mockParams)

  expect(result).toEqual(["Поле: {ИмяПоля}"])
})

it("should format form attributes", () => {
  const expectedResult = `--- Реквизиты ---
ИмяАтрибута:
  Заголовок: Атрибут
  Тип: Строка(10)`

  const form: TClientApplicationForm = {
    elementType: ZElementType.enum.Form,

    childItems: [],
    attributes: [
      {
        name: "ИмяАтрибута",
        id: "1",
        title: { ru: "Атрибут" },
        type: { type: ["string"], stringQualifiers: { length: 10, allowedLength: "Variable" } },
      },
    ],
  }

  const result = formatClientApplicationForm(form, mockParams)

  expect(result.strings.join("\n").trim()).toEqual(expectedResult)
})
