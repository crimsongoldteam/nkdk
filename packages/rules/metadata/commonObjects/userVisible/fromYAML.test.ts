import { describe, expect, it } from "vitest"
import type { UserVisiblePropertyRule } from "@nkdk/runtime/rule-kit"
import { mockContext } from "../../../tests/mockContext"
import { importUserVisibleFromYAML } from "./fromYAML"
import { UserVisibleKeysYAML } from "./types"
import { markYAMLMappingKeyTag } from "@nkdk/runtime"

const userVisibleRule: UserVisiblePropertyRule = {
  type: "UserVisible",
  yaml: UserVisibleKeysYAML.Value,
}

describe("importUserVisibleFromYAML", () => {
  it("imports allow mode from current YAML", () => {
    const roles = {
      Администратор: "Истина" as const,
      "b1d9c8b4-d05c-45c7-8db2-abc84e597700": "Ложь" as const,
    }
    markYAMLMappingKeyTag(roles, "b1d9c8b4-d05c-45c7-8db2-abc84e597700", "xml/reference")
    const result = importUserVisibleFromYAML({
      context: mockContext,
      rule: userVisibleRule,
      value: {
        Роли: roles,
      },
    })

    expect(result).toEqual({
      common: true,
      values: [
        { name: "Role.Администратор", value: true },
        { name: "b1d9c8b4-d05c-45c7-8db2-abc84e597700", value: false },
      ],
    })
  })

  it("imports deny mode from current YAML", () => {
    const roles = {
      Администратор: "Истина" as const,
      "b1d9c8b4-d05c-45c7-8db2-abc84e597700": "Ложь" as const,
    }
    markYAMLMappingKeyTag(roles, "b1d9c8b4-d05c-45c7-8db2-abc84e597700", "xml/reference")
    const result = importUserVisibleFromYAML({
      context: mockContext,
      rule: userVisibleRule,
      value: {
        Разрешить: "Ложь",
        Роли: roles,
      },
    })

    expect(result).toEqual({
      common: false,
      values: [
        { name: "Role.Администратор", value: true },
        { name: "b1d9c8b4-d05c-45c7-8db2-abc84e597700", value: false },
      ],
    })
  })

  it("imports empty deny mode from current YAML", () => {
    const result = importUserVisibleFromYAML({
      context: mockContext,
      rule: userVisibleRule,
      value: {
        Разрешить: "Ложь",
      },
    })

    expect(result).toEqual({
      common: false,
      values: [],
    })
  })

  it("does not read legacy allow or deny YAML keys", () => {
    expect(
      importUserVisibleFromYAML({
        context: mockContext,
        rule: userVisibleRule,
        value: undefined,
        yaml: {
          ["Разрешить" + "Использование"]: { "Role.Администратор": "Истина" },
          ["Запретить" + "Использование"]: { "Role.Пользователь": "Ложь" },
        },
      })
    ).toBeUndefined()
  })
})
