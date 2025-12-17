import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { FormElementType } from "../types"
import { parseClientApplicationForm } from "./parse"
import { ClientApplicationForm } from "./types"

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
      mockConfigurationSettings
    )

    expect(result).toEqual(expectedResult)
  })
})
