import { format } from "path"
import { describe, it } from "vitest"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZElementType } from "../metadata/forms/elements/types"

describe("RulesManager", () => {
  const rules = {
    autoTitle: {
      nameEnterprise: "Автозаголовок",
      type: "boolean",
      inProperties: () => true,
    },
    verticalScroll: {
      nameEnterprise: "ВертикальнаяПрокрутка",
      type: SE.ZVerticalFormScroll,
      typeEnterprise: SE.ZVerticalFormScrollEnterprise,
      inProperties: () => true,
    },
  }

  it("should get rules for element", () => {})
  registerElementRules(ZElementType.enum.InputField, rules)

  const element = {
    elementType: ZElementType.enum.InputField,
    autoTitle: true,
    verticalScroll: "Use",
  }

  const expectedResult = {
    Автозаголовок: "Истина",
    ВертикальнаяПрокрутка: "Использовать",
  }

  const result = format(element)
})
