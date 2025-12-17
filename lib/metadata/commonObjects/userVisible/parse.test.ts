import { describe, expect, it } from "vitest"
import { ConfigurationSettings } from "../../configurationSettings/types"
import { parseUserVisible } from "./parse"

const configurationSettings: ConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("parseUserVisible", () => {
  it("should parse UserVisible with allow usage and values", () => {
    const mock = {
      "Role.Администратор": "Истина" as const,
      "Role.Пользователь": "Ложь" as const,
    }

    const result = parseUserVisible(mock, "РазрешитьИспользование", configurationSettings)

    expect(result).toEqual({
      common: true,
      values: [
        { name: "Администратор", value: true },
        { name: "Пользователь", value: false },
      ],
    })
  })
  it("should parse UserVisible with deny usage and values", () => {
    const mock = {
      "Role.Администратор": "Истина" as const,
      "Role.Пользователь": "Ложь" as const,
    }

    const result = parseUserVisible(mock, "ЗапретитьИспользование", configurationSettings)

    expect(result).toEqual({
      common: false,
      values: [
        { name: "Администратор", value: true },
        { name: "Пользователь", value: false },
      ],
    })
  })
})
