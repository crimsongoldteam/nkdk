import { describe, expect, it } from "vitest"
import { mockcontext } from "~/lib/tests/mockContext"
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

    const result = parseAttributes(orignalContent, mockcontext)

    expect(result).toEqual(expectedResult)
  })
})
