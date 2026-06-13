import { describe, expect, it } from "vitest"
import type { UserVisiblePropertyRule } from "~/metadata/orchestration/property/types"
import { mockContext } from "../../../tests/mockContext"
import { importUserVisibleFromYAML } from "./fromYAML"
import { UserVisibleKeysYAML } from "./types"

const userVisibleRule: UserVisiblePropertyRule = {
  type: "UserVisible",
  yaml: UserVisibleKeysYAML.Value,
}

describe("importUserVisibleFromYAML", () => {
  it("imports allow mode from current YAML", () => {
    const result = importUserVisibleFromYAML({
      context: mockContext,
      rule: userVisibleRule,
      value: {
        Роли: {
          "Role.Администратор": "Истина",
          "b1d9c8b4-d05c-45c7-8db2-abc84e597700": "Ложь",
        },
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
    const result = importUserVisibleFromYAML({
      context: mockContext,
      rule: userVisibleRule,
      value: {
        Разрешить: "Ложь",
        Роли: {
          "Role.Администратор": "Истина",
          "b1d9c8b4-d05c-45c7-8db2-abc84e597700": "Ложь",
        },
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

  it("does not read legacy allow or deny YAML keys", () => {
    expect(
      importUserVisibleFromYAML({
        context: mockContext,
        rule: userVisibleRule,
        value: undefined,
        yaml: {
          РазрешитьИспользование: { "Role.Администратор": "Истина" },
          ЗапретитьИспользование: { "Role.Пользователь": "Ложь" },
        },
      })
    ).toBeUndefined()
  })
})
