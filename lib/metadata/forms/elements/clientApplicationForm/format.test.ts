import { describe, expect, it } from "vitest"
import { ClientApplicationForm, InputField } from "~/lib"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import "~/lib/metadata/forms/elements/elements"
import "~/lib/metadata/forms/elements/exportToXML"
import "~/lib/metadata/forms/elements/importFromXML"
import "~/lib/metadata/forms/elements/inputField/registration"
import "~/lib/metadata/forms/elements/rules"
import { FormElementType } from "../types"
import { formatClientApplicationForm } from "./format"

const configurationSettings: ConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("formatClientApplicationForm", () => {
  it("should format form header", () => {
    const form: ClientApplicationForm = {
      elementType: FormElementType.Form,
      title: { items: { ru: "Форма" } },
      childItems: [],
    }

    const result = formatClientApplicationForm(form, configurationSettings)

    expect(result.strings).toEqual(["--- Форма ---"])
  })

  it("should format form items", () => {
    const input: InputField = {
      name: "ИмяПоля",
      id: "1",
      elementType: FormElementType.InputField,
      title: { items: { ru: "Поле" } },
    }

    const form: ClientApplicationForm = {
      elementType: FormElementType.Form,
      childItems: [input],
    }

    const result = formatClientApplicationForm(form, configurationSettings)

    expect(result.strings).toEqual(["Поле: {ИмяПоля}"])
  })

  it("should format form attributes", () => {
    const expectedResult = `--- Реквизиты ---
ИмяАтрибута:
  Заголовок: Атрибут
  Тип: Строка(10)`

    const form: ClientApplicationForm = {
      elementType: FormElementType.Form,
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

    const result = formatClientApplicationForm(form, configurationSettings)

    expect(result.strings.join("\n").trim()).toEqual(expectedResult)
  })
})
