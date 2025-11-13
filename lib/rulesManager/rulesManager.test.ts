import { describe, it, beforeEach, expect } from "vitest"
import {
  clearElementRules,
  getElementRules,
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
})
