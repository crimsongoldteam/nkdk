import { describe, expect, it } from "vitest"
import { ClientApplicationForm, InputField } from "~/lib"
import "~/lib/metadata/forms/elements/elements"
import "~/lib/metadata/forms/elements/exportToXML"
import "~/lib/metadata/forms/elements/importFromXML"
import "~/lib/metadata/forms/elements/inputField/registration"
import "~/lib/metadata/forms/elements/rules"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { FormElementType } from "../../../metadataFactory/types"
import { exportClientApplicationFormToEnterprise } from "./exportToEnterprise"

describe("formatClientApplicationForm", () => {
  it("should format form header", () => {
    const form: ClientApplicationForm = {
      elementType: FormElementType.Form,
      title: { items: { ru: "Форма" } },
      childItems: [],
    }

    const result = exportClientApplicationFormToEnterprise(mockConfigurationSettings, form)

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

    const result = exportClientApplicationFormToEnterprise(mockConfigurationSettings, form)

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
          valueType: {
            type: ["string"],
            stringQualifiers: { length: 10, allowedLength: "Variable" },
          },
        },
      ],
    }

    const result = exportClientApplicationFormToEnterprise(mockConfigurationSettings, form)

    expect(result.strings.join("\n").trim()).toEqual(expectedResult)
  })
})
