import { describe, expect, it } from "vitest"
import { mockContextFromXML } from "../../../tests/mockContext"
import { parseStructuralXMLWithoutCompatibility } from "../../../tests/structuralXML"
import { importStringOrNumberFromXML } from "./fromXML"

describe("StringOrNumber structural import", () => {
  it("returns the semantic number without retaining the original XML type", () => {
    const value = parseStructuralXMLWithoutCompatibility('<Value xsi:type="xs:integer">42</Value>')
    expect(importStringOrNumberFromXML(mockContextFromXML({ forReference: true }), undefined, value)).toBe(42)
  })
  it.each([
    ["<Value/>", undefined],
    ['<Value xsi:type="xs:string"/>', undefined],
    ["<Value>42</Value>", "42"],
    ['<Value xsi:type="xs:decimal">42</Value>', 42],
    ['<Value xsi:type="xs:string">42</Value>', "42"],
    ["<Value>До<![CDATA[ и после]]></Value>", "До и после"],
  ])("preserves the meaning of %s", (xml, expected) => {
    expect(importStringOrNumberFromXML(mockContextFromXML(), undefined, parseStructuralXMLWithoutCompatibility(xml))).toBe(expected)
  })
})
