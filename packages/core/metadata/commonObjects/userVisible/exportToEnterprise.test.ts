import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { exportUserVisibleToEnterprise } from "./exportToEnterprise"
import { UserVisible, UserVisibleKeysEnterprise } from "./types"

describe("exportUserVisibleToEnterprise", () => {
  it("should format allow `use`", () => {
    const use: UserVisible = {
      common: true,
      values: [
        { name: "Администратор", value: true },
        { name: "Пользователь", value: false },
      ],
    }

    const expectedResult = {
      РазрешитьИспользование: {
        Администратор: "Истина",
        Пользователь: "Ложь",
      },
    }

    const result = exportUserVisibleToEnterprise(mockContext, mockRule, use, {
      allow: UserVisibleKeysEnterprise.Allow,
      deny: UserVisibleKeysEnterprise.Deny,
    })

    expect(result).toEqual(expectedResult)
  })

  it("should format disable `use`", () => {
    const use: UserVisible = {
      common: false,
      values: [
        { name: "Администратор", value: true },
        { name: "Пользователь", value: false },
      ],
    }

    const expectedResult = {
      ЗапретитьИспользование: {
        Администратор: "Истина",
        Пользователь: "Ложь",
      },
    }

    const result = exportUserVisibleToEnterprise(mockContext, mockRule, use, {
      allow: UserVisibleKeysEnterprise.Allow,
      deny: UserVisibleKeysEnterprise.Deny,
    })

    expect(result).toEqual(expectedResult)
  })
})
