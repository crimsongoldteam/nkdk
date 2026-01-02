import { describe, expect, it } from "vitest"
import { mockСontext } from "../../../tests/mockContext"
import { importFromEnterprise } from "./importFromEnterprise"

describe("importFromEnterprise", () => {
  it("should parse UserVisible with allow usage and values", () => {
    const mock = {
      "Role.Администратор": "Истина" as const,
      "Role.Пользователь": "Ложь" as const,
    }

    const result = importFromEnterprise(mockСontext, mock, "РазрешитьИспользование")

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

    const result = importFromEnterprise(mockСontext, mock, "ЗапретитьИспользование")

    expect(result).toEqual({
      common: false,
      values: [
        { name: "Администратор", value: true },
        { name: "Пользователь", value: false },
      ],
    })
  })
})
