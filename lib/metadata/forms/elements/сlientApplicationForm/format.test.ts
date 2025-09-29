import { expect, it } from "vitest"
import { IFormatterParams, WrapInGroupStrategy } from "~/lib/formatter/types"
import { TClientApplicationForm } from "./types"
import { formatClientApplicationForm } from "./format"
import { TInputField } from "../inputField/types"

const mockParams: IFormatterParams = {
  wrapInGroup: WrapInGroupStrategy.None,
  level: 0,
  isFirst: true,
}

it("should format form header", () => {
  const form: TClientApplicationForm = { title: { ru: "Форма" }, items: [] }

  const result = formatClientApplicationForm(form, mockParams)

  expect(result).toEqual(["--- Форма ---"])
})

it("should format form items", () => {
  const input: TInputField = { title: { ru: "Поле" } }

  const form: TClientApplicationForm = { items: [input] }

  const result = formatClientApplicationForm(form, mockParams)

  expect(result).toEqual(["Поле: "])
})
