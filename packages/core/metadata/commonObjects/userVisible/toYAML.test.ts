import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { exportUserVisibleToYAMLDeprecated } from "./toYAML"
import { UserVisible, UserVisibleKeysYAML } from "./types"

describe("exportUserVisibleToYAML", () => {
  it("should format allow `use`", () => {
    const use: UserVisible = {
      common: true,
      values: [
        { name: "Role.Администратор", value: true },
        { name: "Role.Пользователь", value: false },
      ],
    }

    const expectedResult = {
      РазрешитьИспользование: {
        "Role.Администратор": "Истина",
        "Role.Пользователь": "Ложь",
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
        { name: "Role.Администратор", value: true },
        { name: "Role.Пользователь", value: false },
      ],
    }

    const expectedResult = {
      ЗапретитьИспользование: {
        "Role.Администратор": "Истина",
        "Role.Пользователь": "Ложь",
      },
    }

    const result = exportUserVisibleToYAMLDeprecated(mockContext, mockRule, use, {
      allow: UserVisibleKeysYAML.Allow,
      deny: UserVisibleKeysYAML.Deny,
    })

    expect(result).toEqual(expectedResult)
  })

  it("preserves UUID YAML keys", () => {
    const use: UserVisible = {
      common: true,
      values: [{ name: "b1d9c8b4-d05c-45c7-8db2-abc84e597700", value: true }],
    }

    const expectedResult = {
      РазрешитьИспользование: {
        "b1d9c8b4-d05c-45c7-8db2-abc84e597700": "Истина",
      },
    }

    const result = exportUserVisibleToYAMLDeprecated(mockContext, mockRule, use, {
      allow: UserVisibleKeysYAML.Allow,
      deny: UserVisibleKeysYAML.Deny,
    })

    expect(result).toEqual(expectedResult)
  })
})
