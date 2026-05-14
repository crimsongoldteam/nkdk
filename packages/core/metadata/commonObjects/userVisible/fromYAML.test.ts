import { describe, expect, it } from "vitest"
import type { UserVisiblePropertyRule } from "~/metadata/orchestration/property/types"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { importUserVisibleFromYAML, importUserVisibleFromYAMLDeprecated } from "./fromYAML"
import { UserVisibleKeysYAML } from "./types"

const userVisibleRule: UserVisiblePropertyRule = {
  type: "UserVisible",
  yaml: UserVisibleKeysYAML.Allow,
  yamlDeny: UserVisibleKeysYAML.Deny,
}

describe("importUserVisibleFromYAML", () => {
  it("should parse UserVisible with allow usage and values", () => {
    const mock = {
      "Role.Администратор": "Истина" as const,
      "Role.Пользователь": "Ложь" as const,
    }

    const result = importUserVisibleFromYAMLDeprecated(mockContext, mockRule, mock, undefined)

    expect(result).toEqual({
      common: true,
      values: [
        { name: "Role.Администратор", value: true },
        { name: "Role.Пользователь", value: false },
      ],
    })
  })

  it("preserves UUID YAML keys", () => {
    const mock = {
      "b1d9c8b4-d05c-45c7-8db2-abc84e597700": "Истина" as const,
    }

    const result = importUserVisibleFromYAMLDeprecated(mockContext, mockRule, mock, undefined)

    expect(result).toEqual({
      common: true,
      values: [{ name: "b1d9c8b4-d05c-45c7-8db2-abc84e597700", value: true }],
    })
  })

  it("should parse UserVisible with deny usage and values", () => {
    const mock = {
      "Role.Администратор": "Истина" as const,
      "Role.Пользователь": "Ложь" as const,
    }

    const result = importUserVisibleFromYAMLDeprecated(mockContext, mockRule, undefined, mock)

    expect(result).toEqual({
      common: false,
      values: [
        { name: "Role.Администратор", value: true },
        { name: "Role.Пользователь", value: false },
      ],
    })
  })

  it("preserves Role-prefixed names and UUID keys with current YAML importer", () => {
    const mock = {
      "Role.Администратор": "Истина" as const,
      "b1d9c8b4-d05c-45c7-8db2-abc84e597700": "Ложь" as const,
    }

    const result = importUserVisibleFromYAML({
      context: mockContext,
      rule: userVisibleRule,
      value: mock,
    })

    expect(result).toEqual({
      common: true,
      values: [
        { name: "Role.Администратор", value: true },
        { name: "b1d9c8b4-d05c-45c7-8db2-abc84e597700", value: false },
      ],
    })
  })

  it("preserves Role-prefixed names and UUID keys from deny YAML with current importer", () => {
    const mock = {
      "Role.Администратор": "Истина" as const,
      "b1d9c8b4-d05c-45c7-8db2-abc84e597700": "Ложь" as const,
    }

    const result = importUserVisibleFromYAML({
      context: mockContext,
      rule: userVisibleRule,
      value: undefined,
      yaml: { [UserVisibleKeysYAML.Deny]: mock },
    })

    expect(result).toEqual({
      common: false,
      values: [
        { name: "Role.Администратор", value: true },
        { name: "b1d9c8b4-d05c-45c7-8db2-abc84e597700", value: false },
      ],
    })
  })
})
