import { parseMetadataYaml } from "@nkdk/runtime"
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

  it("сохраняет UUID роли только с !xml/uuid", () => {
    const uuid = "a786340b-1ca9-48ee-8517-6bd389390bcc"
    const parsed = parseMetadataYaml([
      "Использование:",
      "  Роли:",
      `    !xml/uuid ${uuid}: Истина`,
    ].join("\n"))
    const yaml = parsed.data as { Использование: unknown }
    const roles = (yaml.Использование as { Роли: Record<string, unknown> }).Роли
    expect(parsed.annotations.keyAt(roles, Object.keys(roles)[0]!)).toMatchObject({
      kind: "uuid",
      logicalKey: uuid,
    })

    expect(importUserVisibleFromYAML({
      context: mockContext,
      rule: userVisibleRule,
      value: yaml.Использование,
      yaml,
      annotations: parsed.annotations,
    })).toEqual({
      common: true,
      values: [{ name: uuid, value: true }],
    })
    expect(() => importUserVisibleFromYAML({
      context: mockContext,
      rule: userVisibleRule,
      value: { Роли: { [uuid]: "Истина" } },
      yaml: { Использование: { Роли: { [uuid]: "Истина" } } },
    })).toThrow("UUID metadata-ссылки требует !xml/uuid")

    const invalid = parseMetadataYaml([
      "Использование:",
      "  Роли:",
      `    !xml/invalid ${uuid}: Истина`,
    ].join("\n"))
    const invalidYaml = invalid.data as {
      Использование: Parameters<typeof importUserVisibleFromYAML>[0]["value"]
    }
    expect(() => importUserVisibleFromYAML({
      context: mockContext,
      rule: userVisibleRule,
      value: invalidYaml.Использование,
      yaml: invalid.data as Record<string, unknown>,
      annotations: invalid.annotations,
    })).toThrow("UUID metadata-ссылки требует !xml/uuid")
  })
})
