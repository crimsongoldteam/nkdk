import { beforeEach, describe, expect, it, vi } from "vitest"
import { ConfigurationSettings } from "../metadata/configurationSettings/types"
import { FormElementType } from "../metadata/forms/elements/types"
import { clearElementRules, formatProperty, registerElementRules } from "../rulesManager/rulesManager"
import { ElementRules } from "../rulesManager/types"

const configurationSettings: ConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("format", () => {
  beforeEach(() => {
    clearElementRules()
  })

  it("should format value with properties function", () => {
    const formatFunction = vi.fn().mockReturnValue("test")
    const rules: ElementRules = {
      autoTitle: {
        nameEnterprise: "Автозаголовок",
        type: "boolean",
        formatProperties: formatFunction,
        inProperties: () => true,
      },
    }

    registerElementRules(FormElementType.InputField, rules)

    const format = formatProperty("testValue", rules.autoTitle, configurationSettings)

    expect(format).toEqual("test")
  })
})
