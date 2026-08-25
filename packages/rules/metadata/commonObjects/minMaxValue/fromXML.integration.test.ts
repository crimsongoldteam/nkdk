import { serializeYAMLDocument } from "@nkdk/runtime"
import { createRuleRegistrySet,type PropertyRule } from "@nkdk/runtime/rule-kit"
import { describe,expect,it } from "vitest"
import { mockContext } from "../../../tests/mockContext"
import { testImportPropertyFromXML } from "../../../tests/property/importPropertyFromXML"
import { metadataRules } from "../../composition/metadataRules"
import { exportPropertyToYAML } from "../../ruleRuntime/property/toYAML"

import "./fromXML"
import "./toYAML"

const stringRule = {
  type: "MinMaxValue",
  yaml: "МинимальноеЗначение",
  typedXML: "xs:string",
} as PropertyRule

const execution = createRuleRegistrySet(metadataRules).execution

describe("MinMaxValue XML → YAML", () => {

  it("imports canonical decimal comma as a number", () => {
    expect(importAndSerialize(stringRule, '<MinValue xsi:type="xs:string">0,005</MinValue>'))
      .toBe("МинимальноеЗначение: 0.005")
  })

  it("imports an empty typed value as undefined", () => {
    const value = testImportPropertyFromXML({
      rule: stringRule,
      xmlString: '<MinValue xsi:type="xs:string"/>',
      xmlRootTag: "MinValue",
    })

    expect(value).toBeUndefined()
  })
})

function importAndSerialize(rule: PropertyRule, xmlString: string): string {
  const value = testImportPropertyFromXML({ rule, xmlString, xmlRootTag: "MinValue" })
  const yaml = exportPropertyToYAML({ context: mockContext, rule, value, execution })
  if (yaml === undefined) throw new Error("MinMaxValue не экспортирован в YAML")
  return serializeYAMLDocument(yaml).text.trim()
}
