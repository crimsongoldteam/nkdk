import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { importPropertyFromYAML } from "./fromYAML"
import type { PropertyRule } from "./types"

const defaultRule = {
  yaml: "Поле",
  type: "string",
  defaultValueYAML: "model-default",
} as const satisfies PropertyRule

describe("importPropertyFromYAML", () => {
  it("does not apply defaultValueYAML to missing YAML without opt-in", () => {
    expect(
      importPropertyFromYAML({
        context: mockContext,
        rule: defaultRule,
        value: undefined,
        yaml: {},
      })
    ).toBeUndefined()
  })

  it("applies model-compatible YAML default when opt-in condition matches", () => {
    expect(
      importPropertyFromYAML({
        context: mockContext,
        rule: {
          ...defaultRule,
          applyModelDefaultValueYAMLOnImport: {
            whenAnyYAMLKeyPresent: ["Маркер"],
          },
        },
        value: undefined,
        yaml: { Маркер: "есть" },
      })
    ).toBe("model-default")
  })

  it("does not apply model-compatible YAML default when opt-in condition is absent", () => {
    expect(
      importPropertyFromYAML({
        context: mockContext,
        rule: {
          ...defaultRule,
          applyModelDefaultValueYAMLOnImport: {
            whenAnyYAMLKeyPresent: ["Маркер"],
          },
        },
        value: undefined,
        yaml: {},
      })
    ).toBeUndefined()
  })
})
