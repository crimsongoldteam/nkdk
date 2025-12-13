import { describe, expect, it } from "vitest"
import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { IAttribute } from "../types"
import { parseAttributes } from "./parse"

const configurationSettings: TConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("parseAttributes", () => {
  it("should parse attributes", () => {
    const orignalContent = `ИмяАтрибута:
  Заголовок: Атрибут
  Тип: Строка(10)`

    const expectedResult: IAttribute[] = [
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

    const result = parseAttributes(orignalContent, configurationSettings)

    expect(result).toEqual(expectedResult)
  })
})
