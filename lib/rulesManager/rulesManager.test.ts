import { describe, it, beforeEach, expect, vi } from "vitest"
import {
  clearElementRules,
  getElementRules,
  getFormatPropertiesFunction,
  registerElementRules,
} from "./rulesManager"
import { TElementRules } from "./types"
import { ZElementType } from "../metadata/forms/elements/types"

describe("RulesManager", () => {
  beforeEach(() => {
    clearElementRules()
  })

  it("should get rules for element", () => {
    const rules: TElementRules = {
      autoTitle: {
        nameEnterprise: "Автозаголовок",
        type: "boolean",
        format: () => {},
        inProperties: () => true,
      },
    }

    registerElementRules(ZElementType.enum.InputField, rules)

    const result = getElementRules(ZElementType.enum.InputField)

    expect(result).toEqual(rules)
  })

  it("should return format properties function", () => {
    const formatFunction = vi.fn().mockReturnValue({})
    const rules: TElementRules = {
      autoTitle: {
        nameEnterprise: "Автозаголовок",
        type: "boolean",
        format: formatFunction,
        inProperties: () => true,
      },
    }

    registerElementRules(ZElementType.enum.InputField, rules)

    const format = getFormatPropertiesFunction(
      ZElementType.enum.InputField,
      "autoTitle"
    )

    expect(format).toEqual(formatFunction)
  })

  it("should return undefined if inProperties is false", () => {
    const formatFunction = vi.fn().mockReturnValue({})

    const rules: TElementRules = {
      autoTitle: {
        nameEnterprise: "Автозаголовок",
        type: "boolean",
        format: formatFunction,
        inProperties: () => false,
      },
    }
    registerElementRules(ZElementType.enum.InputField, rules)

    const format = getFormatPropertiesFunction(
      ZElementType.enum.InputField,
      "autoTitle"
    )

    expect(format).toBeUndefined()
  })
})
