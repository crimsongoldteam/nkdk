import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "../../../tests/mockConfigurationSettings"
import { parseUserVisible } from "./parse"

describe("parseUserVisible", () => {
  it("should parse UserVisible with allow usage and values", () => {
    const mock = {
      "Role.Администратор": "Истина" as const,
      "Role.Пользователь": "Ложь" as const,
    }

    const result = parseUserVisible(mock, "РазрешитьИспользование", mockConfigurationSettings)

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

    const result = parseUserVisible(mock, "ЗапретитьИспользование", mockConfigurationSettings)

    expect(result).toEqual({
      common: false,
      values: [
        { name: "Администратор", value: true },
        { name: "Пользователь", value: false },
      ],
    })
  })
})
