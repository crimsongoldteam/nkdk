import { describe, expect, it } from "vitest"
import type { UserVisiblePropertyRule } from "../../orchestration/property/types"
import { mockContext } from "../../../tests/mockContext"
import { exportUserVisibleToYAML } from "./toYAML"
import { UserVisibleKeysYAML, type UserVisible } from "./types"

const userVisibleRule: UserVisiblePropertyRule = {
  type: "UserVisible",
  yaml: UserVisibleKeysYAML.Value,
}

describe("exportUserVisibleToYAML", () => {
  it("exports empty deny usage", () => {
    const use: UserVisible = {
      common: false,
      values: [],
    }

    const result = exportUserVisibleToYAML(mockContext, userVisibleRule, use)

    expect(result).toEqual({
      Использование: {
        Разрешить: "Ложь",
      },
    })
  })

  it("does not export empty allow usage", () => {
    const use: UserVisible = {
      common: true,
      values: [],
    }

    const result = exportUserVisibleToYAML(mockContext, userVisibleRule, use)

    expect(result).toBeUndefined()
  })

  it("should format allow `use`", () => {
    const use: UserVisible = {
      common: true,
      values: [
        { name: "Role.Администратор", value: true },
        { name: "Role.Пользователь", value: false },
      ],
    }

    const expectedResult = {
      Использование: {
        Роли: {
          "Role.Администратор": "Истина",
          "Role.Пользователь": "Ложь",
        },
      },
    }

    const result = exportUserVisibleToYAML(mockContext, userVisibleRule, use)

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
      Использование: {
        Разрешить: "Ложь",
        Роли: {
          "Role.Администратор": "Истина",
          "Role.Пользователь": "Ложь",
        },
      },
    }

    const result = exportUserVisibleToYAML(mockContext, userVisibleRule, use)

    expect(result).toEqual(expectedResult)
  })

  it("preserves UUID YAML keys", () => {
    const use: UserVisible = {
      common: true,
      values: [{ name: "b1d9c8b4-d05c-45c7-8db2-abc84e597700", value: true }],
    }

    const expectedResult = {
      Использование: {
        Роли: {
          "b1d9c8b4-d05c-45c7-8db2-abc84e597700": "Истина",
        },
      },
    }

    const result = exportUserVisibleToYAML(mockContext, userVisibleRule, use)

    expect(result).toEqual(expectedResult)
  })

  it("exports Role-prefixed names and UUID keys with current YAML exporter", () => {
    const use: UserVisible = {
      common: true,
      values: [
        { name: "Role.Администратор", value: true },
        { name: "b1d9c8b4-d05c-45c7-8db2-abc84e597700", value: false },
      ],
    }

    const result = exportUserVisibleToYAML(mockContext, userVisibleRule, use)

    expect(result).toEqual({
      Использование: {
        Роли: {
          "Role.Администратор": "Истина",
          "b1d9c8b4-d05c-45c7-8db2-abc84e597700": "Ложь",
        },
      },
    })
  })

  it("exports Role-prefixed names and UUID keys to deny YAML with current exporter", () => {
    const use: UserVisible = {
      common: false,
      values: [
        { name: "Role.Администратор", value: true },
        { name: "b1d9c8b4-d05c-45c7-8db2-abc84e597700", value: false },
      ],
    }

    const result = exportUserVisibleToYAML(mockContext, userVisibleRule, use)

    expect(result).toEqual({
      Использование: {
        Разрешить: "Ложь",
        Роли: {
          "Role.Администратор": "Истина",
          "b1d9c8b4-d05c-45c7-8db2-abc84e597700": "Ложь",
        },
      },
    })
  })
})
