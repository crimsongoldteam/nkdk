import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { FormAttribute } from "../types"
import { parseAttributes } from "./parse"

describe("parseAttributes", () => {
  it("should parse attributes", () => {
    const orignalContent = `ИмяАтрибута:
  Заголовок: Атрибут
  Тип: Строка(10)`

    const expectedResult: FormAttribute[] = [
      {
        name: "ИмяАтрибута",
        id: "",
        title: { items: { ru: "Атрибут" } },
        type: {
          type: ["string"],
          stringQualifiers: { length: 10, allowedLength: "Variable" },
        },
      },
    ]

    const result = parseAttributes(orignalContent, mockConfigurationSettings)

    expect(result).toEqual(expectedResult)
  })
})
