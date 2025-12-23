import { describe, expect, it } from "vitest"
import { mockcontext } from "~/lib/tests/mockContext"
import { FormElementType } from "../../../metadataFactory/types"
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
          valueType: {
            type: ["string"],
            stringQualifiers: { length: 10, allowedLength: "Variable" },
          },
        },
      ],
    }

    const result = parseClientApplicationForm(orignalContent, mockcontext)

    expect(result).toEqual(expectedResult)
  })
})
