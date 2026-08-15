import { describe, expect, it } from "vitest"
import { serializeYAMLDocument } from "@nkdk/runtime"
import { createRuleRegistrySet, type PropertyRule } from "@nkdk/runtime/rule-kit"
import { exportPropertyToYAML } from "../../ruleRuntime/property/toYAML"
import { metadataRules } from "../../composition/metadataRules"
import { mockContext } from "../../../tests/mockContext"
import { testImportPropertyFromXML } from "../../../tests/property/importPropertyFromXML"

import "./fromXML"
import "./toYAML"

const stringRule = {
  type: "MinMaxValue",
  yaml: "МинимальноеЗначение",
  typedXML: "xs:string",
} as PropertyRule

const decimalRule = {
  type: "MinMaxValue",
  yaml: "МинимальноеЗначение",
  typedXML: "xs:decimal",
} as PropertyRule

const execution = createRuleRegistrySet(metadataRules).execution

describe("MinMaxValue XML → YAML", () => {
  it.each([
    ['<MinValue xsi:type="xs:string">1</MinValue>', stringRule, "МинимальноеЗначение: 1"],
    ['<MinValue xsi:type="xs:string">001.00</MinValue>', stringRule, 'МинимальноеЗначение: !xml/value "001.00"'],
    ['<MinValue xsi:type="xs:decimal">001.00</MinValue>', decimalRule, 'МинимальноеЗначение: !xml/value "001.00"'],
    ['<MinValue xsi:type="xs:dateTime">bad</MinValue>', stringRule, "МинимальноеЗначение: !xml/type xs:dateTime bad"],
    ["<MinValue>bad</MinValue>", stringRule, 'МинимальноеЗначение: !xml/type "- bad"'],
  ] as const)("imports exact representation from %s", (xmlString, rule, expected) => {
    expect(importAndSerialize(rule, xmlString)).toBe(expected)
  })

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
