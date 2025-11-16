import { describe, expect, it } from "vitest"
import "~/lib/metadata/forms/elements/elements"
import "~/lib/metadata/forms/elements/exportToXML"
import "~/lib/metadata/forms/elements/importFromXML"
import "~/lib/metadata/forms/elements/rules"
import { IFormatterParams, WrapInGroupStrategy } from "~/lib/format/types"
import { formatClientApplicationForm } from "./format"
import { TClientApplicationForm, TInputField } from "~/lib"
import { ZElementType } from "../types"
import "~/lib/metadata/forms/elements/inputField/registration"

const mockParams: IFormatterParams = {
  wrapInGroup: WrapInGroupStrategy.None,
  level: 0,
  isFirst: true,
}

describe("formatClientApplicationForm", () => {
  it("should format form header", () => {
    const form: TClientApplicationForm = {
      elementType: ZElementType.enum.Form,
      title: { items: { ru: "Форма" } },
      childItems: [],
    }

    const result = formatClientApplicationForm(form, mockParams)

    expect(result.strings).toEqual(["====== [ Форма ] ======"])
  })

  it("should format form items", () => {
    const input: TInputField = {
      name: "ИмяПоля",
      id: "1",
      elementType: ZElementType.enum.InputField,
      title: { items: { ru: "Поле" } },
    }

    const form: TClientApplicationForm = {
      elementType: ZElementType.enum.Form,
      childItems: [input],
    }

    const result = formatClientApplicationForm(form, mockParams)

    expect(result.strings).toEqual(["Поле: {ИмяПоля}"])
  })

  it("should format form attributes", () => {
    const expectedResult = `====== [ Реквизиты ] ======
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
          title: { items: { ru: "Атрибут" } },
          type: {
            type: ["string"],
            stringQualifiers: { length: 10, allowedLength: "Variable" },
          },
        },
      ],
    }

    const result = formatClientApplicationForm(form, mockParams)

    expect(result.strings.join("\n").trim()).toEqual(expectedResult)
  })
})
