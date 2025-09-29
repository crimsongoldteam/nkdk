import { expect, it } from "vitest"
import { IFormatterParams } from "~/lib/formatter/types"
import { I8nText, WrapInGroupStrategy } from "~/lib/metadata/forms/interfaces"
import { TClientApplicationForm } from "./types"
import { formatClientApplicationForm } from "./format"
import { container } from "tsyringe"
import { TInputField } from "../inputField/types"

const mockParams: IFormatterParams = {
  wrapInGroup: WrapInGroupStrategy.None,
  level: 0,
  isFirst: true,
}

let form: TClientApplicationForm

it("should format form header", () => {
  const form: TClientApplicationForm = { title: { ru: "Форма" } as I8nText, items: [] }

  const result = formatClientApplicationForm(form, mockParams)

  expect(result).toEqual(["--- Форма ---"])
})

it("should format form items", () => {
  const input: TInputField = { title: { ru: "Поле" } as I8nText }

  const form: TClientApplicationForm = { items: [input] }

  const result = formatClientApplicationForm(form, mockParams)

  expect(result).toEqual(["Поле: "])
})
