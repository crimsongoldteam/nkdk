import { describe, expect, it } from "vitest"
import "~/lib/metadata/forms/elements/rules"
import "~/metadata/forms/elements/elements"
import "~/metadata/forms/elements/exportToXML"
import "~/metadata/forms/elements/importFromXML"
import "~/metadata/forms/elements/inputField/registration"
import { mockСontext } from "~/tests/mockContext"
import { InputField } from "../elements/inputField/types"
import { exportClientApplicationFormToEnterprise } from "./exportToEnterprise"
import { ClientApplicationForm } from "./types"

describe(" formatClientApplicationForm", () => {
  it("should format form header", () => {
    const form: ClientApplicationForm = {
      title: { items: { ru: "Форма" } },
      childItems: [],
    }

    const result = exportClientApplicationFormToEnterprise(mockСontext, form)

    expect(result.strings).toEqual(["--- Форма ---"])
  })

  it("should format form items", () => {
    const input: InputField = {
      name: "ИмяПоля",
      id: "1",
      title: { items: { ru: "Поле" } },
    }

    const form: ClientApplicationForm = {
      childItems: [input],
    }

    const result = exportClientApplicationFormToEnterprise(mockСontext, form)

    expect(result.strings).toEqual(["Поле: {ИмяПоля}"])
  })

  it("should format form attributes", () => {
    const expectedResult = `--- Реквизиты ---
ИмяАтрибута:
  Заголовок: Атрибут
  Тип: Строка(10)`

    const form: ClientApplicationForm = {
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

    const result = exportClientApplicationFormToEnterprise(mockСontext, form)

    expect(result.strings.join("\n").trim()).toEqual(expectedResult)
  })
})
