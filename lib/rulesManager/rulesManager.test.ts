import { beforeEach, describe, expect, it, vi } from "vitest"
import { FormElementType } from "../metadata/forms/elements/types"
import {
  clearElementRules,
  formatProperty,
  getElementRules,
  registerElementRules,
} from "./rulesManager"
import { TElementRules } from "./types"

const configurationSettings = { defaultLanguage: "ru" }

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

    registerElementRules(FormElementType.InputField, rules)

    const result = getElementRules(FormElementType.InputField)

    expect(result).toEqual(rules)
  })

  it("should return format properties function", () => {
    const formatFunction = vi.fn().mockReturnValue("test")
    const rules: TElementRules = {
      autoTitle: {
        nameEnterprise: "Автозаголовок",
        type: "boolean",
        formatProperties: formatFunction,
        inProperties: () => true,
      },
    }

    registerElementRules(FormElementType.InputField, rules)

    const format = formatProperty(
      "testValue",
      rules.autoTitle,
      configurationSettings
    )

    expect(format).toEqual("test")
  })

  it("should return undefined if inProperties is false", () => {
    const formatFunction = vi.fn().mockReturnValue("test")
    const rules: TElementRules = {
      autoTitle: {
        nameEnterprise: "Автозаголовок",
        type: "boolean",
        formatProperties: formatFunction,
        inProperties: () => false,
      },
    }
    registerElementRules(FormElementType.InputField, rules)

    const format = formatProperty(
      "testValue",
      rules.autoTitle,
      configurationSettings
    )

    expect(format).toBeUndefined()
  })
})
