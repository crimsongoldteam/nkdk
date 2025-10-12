import { expect, it } from "vitest"
import { IFormatterParams, WrapInGroupStrategy } from "~/lib/format/types"
import { TClientApplicationForm } from "./types"
import { formatClientApplicationForm } from "./format"
import { TInputField } from "~/lib"
import { ElementType } from "~/lib/metadata/systemEnumerations/types"

const mockParams: IFormatterParams = {
  wrapInGroup: WrapInGroupStrategy.None,
  level: 0,
  isFirst: true,
}

it("should format form header", () => {
  const form: TClientApplicationForm = {
    name: "Форма",
    id: "1",
    type: ElementType.ClientApplicationForm,
    title: { ru: "Форма" },
    items: [],
  }

  const result = formatClientApplicationForm(form, mockParams)

  expect(result).toEqual(["--- Форма ---"])
})

it("should format form items", () => {
  const input: TInputField = { name: "ИмяПоля", title: { ru: "Поле" } }

  const form: TClientApplicationForm = { items: [input] }

  const result = formatClientApplicationForm(form, mockParams)

  expect(result).toEqual(["Поле: {ИмяПоля}"])
})

it("should format form attributes", () => {
  const expectedResult = `--- Реквизиты ---
ИмяАтрибута:
  Заголовок: Атрибут
  Тип: Строка(10)`

  const form: TClientApplicationForm = {
    items: [],
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

  expect(result.join("\n").trim()).toEqual(expectedResult)
})
