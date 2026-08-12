import { describe, expect, it } from "vitest"
import { importFromYAML } from "@nkdk/runtime"
import { createRuleRegistrySet, type MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { serializeDirectXML, testPropertyFromYAMLToXML } from "../../../tests/directConversion"
import { metadataRules } from "../../composition/metadataRules"

import "./fromYAML"
import "./toXML"

const stringRule = probeRule("xs:string")
const decimalRule = probeRule("xs:decimal")
const execution = createRuleRegistrySet(metadataRules).execution

describe("MinMaxValue YAML → XML", () => {
  it.each([
    ["МинимальноеЗначение: 1", decimalRule, '<MinValue xsi:type="xs:decimal">1</MinValue>'],
    ["МинимальноеЗначение: !xml String 001.00", decimalRule, '<MinValue xsi:type="xs:string">001.00</MinValue>'],
    ["МинимальноеЗначение: !xml Decimal 001.00", stringRule, '<MinValue xsi:type="xs:decimal">001.00</MinValue>'],
    ["МинимальноеЗначение: !xml Raw xs:dateTime bad", stringRule, '<MinValue xsi:type="xs:dateTime">bad</MinValue>'],
    ["МинимальноеЗначение: !xml Raw - bad", stringRule, "<MinValue>bad</MinValue>"],
  ] as const)("exports %s without reference XML", (yamlText, rule, expected) => {
    const xml = serializeDirectXML(testPropertyFromYAMLToXML({
      rule,
      yaml: importFromYAML(yamlText),
      execution,
    }).xml)

    expect(xml).toContain(expected)
  })

  it.each([
    "МинимальноеЗначение: !xml String",
    "МинимальноеЗначение: !xml Decimal nope",
    "МинимальноеЗначение: !xml Raw",
    "МинимальноеЗначение: !xml Unknown 1",
  ])("rejects invalid transport %s", (yamlText) => {
    expect(() => testPropertyFromYAMLToXML({
      rule: stringRule,
      yaml: importFromYAML(yamlText),
      execution,
    })).toThrow()
  })
})

function probeRule(typedXML: "xs:string" | "xs:decimal"): MetadataItemRule {
  return {
    itemType: `MinMaxValueProbe.${typedXML}`,
    properties: {
      value: {
        type: "MinMaxValue",
        yaml: "МинимальноеЗначение",
        xml: "MinValue",
        typedXML,
      },
    },
  } as MetadataItemRule
}
