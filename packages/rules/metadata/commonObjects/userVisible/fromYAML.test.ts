import type { UserVisiblePropertyRule } from "@nkdk/runtime/rule-kit"
import { describe, expect, it } from "vitest"
import { mockContext } from "../../../tests/mockContext"
import { importUserVisibleFromYAML } from "./fromYAML"
import { UserVisibleKeysYAML } from "./types"

const userVisibleRule: UserVisiblePropertyRule = {
  type: "UserVisible",
  yaml: UserVisibleKeysYAML.Value,
}

describe("importUserVisibleFromYAML", () => {
  it("imports allow mode from current YAML", () => {
    expect(importUserVisibleFromYAML({
      context: mockContext,
      rule: userVisibleRule,
      value: { Роли: { Администратор: "Истина" } },
    })).toEqual({
      common: true,
      values: [{ name: "Role.Администратор", value: true }],
    })
  })

  it("imports deny mode from current YAML", () => {
    expect(importUserVisibleFromYAML({
      context: mockContext,
      rule: userVisibleRule,
      value: {
        Разрешить: "Ложь",
        Роли: { Администратор: "Истина" },
      },
    })).toEqual({
      common: false,
      values: [{ name: "Role.Администратор", value: true }],
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
