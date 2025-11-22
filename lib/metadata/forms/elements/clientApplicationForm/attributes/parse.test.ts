import { describe, expect, it } from "vitest"
import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { TAttribute } from "../types"
import parseAttributes from "./parse"

const configurationSettings: TConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("parseAttributes", () => {
  it("should parse attributes", () => {
    const orignalContent = `ИмяАтрибута:
  Заголовок: Атрибут`

    const expectedResult: TAttribute[] = [
      {
        name: "ИмяАтрибута",
        id: "",
        title: { items: { ru: "Атрибут" } },
      },
    ]

    const result = parseAttributes(orignalContent, configurationSettings)

    expect(result).toEqual(expectedResult)
  })
})
