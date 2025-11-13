import { describe, it, beforeEach, expect, vi } from "vitest"
import {
  clearElementRules,
  formatProperty as formatProperty,
  registerElementRules,
} from "../rulesManager/rulesManager"
import { TElementRules } from "../rulesManager/types"
import { ZElementType } from "../metadata/forms/elements/types"

describe("format", () => {
  beforeEach(() => {
    clearElementRules()
  })

  it("should format value with properties function", () => {
    const formatFunction = vi.fn().mockReturnValue("test")
    const rules: TElementRules = {
      autoTitle: {
        nameEnterprise: "Автозаголовок",
        type: "boolean",
        formatProperties: formatFunction,
        inProperties: () => true,
      },
    }

    registerElementRules(ZElementType.enum.InputField, rules)

    const format = formatProperty(
      ZElementType.enum.InputField,
      "autoTitle",
      "testValue"
    )

    expect(format).toEqual("test")
  })
})
