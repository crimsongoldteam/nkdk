import { describe, expect, it } from "vitest"
import { serializeYAMLDocument } from "@nkdk/runtime"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { exportPropertyToYAML } from "../../ruleRuntime/property/toYAML"
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

describe("MinMaxValue XML → YAML", () => {
  it.each([
    ['<MinValue xsi:type="xs:string">1</MinValue>', stringRule, "МинимальноеЗначение: 1"],
    ['<MinValue xsi:type="xs:string">001.00</MinValue>', stringRule, "МинимальноеЗначение: !xml String 001.00"],
    ['<MinValue xsi:type="xs:decimal">001.00</MinValue>', decimalRule, "МинимальноеЗначение: !xml Decimal 001.00"],
    ['<MinValue xsi:type="xs:dateTime">bad</MinValue>', stringRule, "МинимальноеЗначение: !xml Raw xs:dateTime bad"],
    ["<MinValue>bad</MinValue>", stringRule, "МинимальноеЗначение: !xml Raw - bad"],
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
  const yaml = exportPropertyToYAML({ context: mockContext, rule, value })
  if (yaml === undefined) throw new Error("MinMaxValue не экспортирован в YAML")
  return serializeYAMLDocument(yaml).text.trim()
}
