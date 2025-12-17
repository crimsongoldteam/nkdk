import { describe, expect, it } from "vitest"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { FormElementType } from "../types"
import { parseClientApplicationForm } from "./parse"
import { ClientApplicationForm } from "./types"

const configurationSettings: ConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("parseClientApplicationForm", () => {
  it("should parse form with attributes", () => {
    const orignalContent = `--- Реквизиты ---
ИмяАтрибута:
  Заголовок: Атрибут
  Тип: Строка(10)`

    const expectedResult: ClientApplicationForm = {
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

    const result = parseClientApplicationForm(
      orignalContent,
      configurationSettings
    )

    expect(result).toEqual(expectedResult)
  })
})
