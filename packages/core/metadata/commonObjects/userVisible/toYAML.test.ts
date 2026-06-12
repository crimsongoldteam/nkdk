import { describe, expect, it } from "vitest"
import type { UserVisiblePropertyRule } from "~/metadata/orchestration/property/types"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { exportUserVisibleToYAML, exportUserVisibleToYAMLDeprecated } from "./toYAML"
import { UserVisible, UserVisibleKeysYAML } from "./types"

const userVisibleRule: UserVisiblePropertyRule = {
  type: "UserVisible",
  yaml: UserVisibleKeysYAML.Allow,
  yamlDeny: UserVisibleKeysYAML.Deny,
}

describe("exportUserVisibleToYAML", () => {
  it("does not export empty deny usage", () => {
    const use: UserVisible = {
      common: false,
      values: [],
    }

    const result = exportUserVisibleToYAML(mockContext, userVisibleRule, use)

    expect(result).toBeUndefined()
  })

  it("does not export empty allow usage", () => {
    const use: UserVisible = {
      common: true,
      values: [],
    }

    const result = exportUserVisibleToYAML(mockContext, userVisibleRule, use)

    expect(result).toBeUndefined()
  })

  it("deprecated exporter does not export empty deny usage", () => {
    const use: UserVisible = {
      common: false,
      values: [],
    }

    const result = exportUserVisibleToYAMLDeprecated(mockContext, mockRule, use, {
      allow: UserVisibleKeysYAML.Allow,
      deny: UserVisibleKeysYAML.Deny,
    })

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
      РазрешитьИспользование: {
        "Role.Администратор": "Истина",
        "b1d9c8b4-d05c-45c7-8db2-abc84e597700": "Ложь",
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
      ЗапретитьИспользование: {
        "Role.Администратор": "Истина",
        "b1d9c8b4-d05c-45c7-8db2-abc84e597700": "Ложь",
      },
    })
  })
})
