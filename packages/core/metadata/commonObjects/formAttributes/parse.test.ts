import { describe, expect, it } from "vitest"
import { mockСontext } from "~/packages/core/tests/mockContext"
import { parseAttributes } from "./parse"
import { FormAttribute } from "./types"

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

    const result = parseAttributes(orignalContent, mockСontext)

    expect(result).toEqual(expectedResult)
  })
})
