import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { exportUserVisibleToYAMLDeprecated } from "./toYAML"
import { UserVisible, UserVisibleKeysYAML } from "./types"

describe("exportUserVisibleToYAML", () => {
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

    const result = exportUserVisibleToYAMLDeprecated(mockContext, mockRule, use, {
      allow: UserVisibleKeysYAML.Allow,
      deny: UserVisibleKeysYAML.Deny,
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

    const result = exportUserVisibleToYAMLDeprecated(mockContext, mockRule, use, {
      allow: UserVisibleKeysYAML.Allow,
      deny: UserVisibleKeysYAML.Deny,
    })

    expect(result).toEqual(expectedResult)
  })
})
