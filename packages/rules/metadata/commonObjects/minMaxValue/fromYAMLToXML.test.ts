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
    ["МинимальноеЗначение: !xml/value 001.00", decimalRule, '<MinValue xsi:type="xs:decimal">001.00</MinValue>'],
    ["МинимальноеЗначение: !xml/type xs:string 001.00", decimalRule, '<MinValue xsi:type="xs:string">001.00</MinValue>'],
    ["МинимальноеЗначение: !xml/type xs:dateTime bad", stringRule, '<MinValue xsi:type="xs:dateTime">bad</MinValue>'],
    ['МинимальноеЗначение: !xml/type "- bad"', stringRule, "<MinValue>bad</MinValue>"],
  ] as const)("exports %s without reference XML", (yamlText, rule, expected) => {
    const xml = serializeDirectXML(testPropertyFromYAMLToXML({
      rule,
      yaml: importFromYAML(yamlText),
      execution,
    }).xml)

    expect(xml).toContain(expected)
  })

  it.each([
    "МинимальноеЗначение: !xml/value",
    "МинимальноеЗначение: !xml/type",
    "МинимальноеЗначение: !xml/type xs:string",
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
