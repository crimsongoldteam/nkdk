import { describe, expect, it } from "vitest"
import { importContentFromXML } from "@nkdk/runtime"
import { mockContextFromXML } from "../../../tests/mockContext"
import { parseStructuralXMLWithoutCompatibility } from "../../../tests/structuralXML"
import { importStringOrNumberFromXML } from "./fromXML"

describe("StringOrNumber structural import", () => {
  it.each([
    ["<Value/>", undefined],
    ['<Value xsi:type="xs:string"/>', undefined],
    ["<Value>42</Value>", "42"],
    ['<Value xsi:type="xs:decimal">42</Value>', 42],
    ['<Value xsi:type="xs:string">42</Value>', "42"],
    ["<Value>До<![CDATA[ и после]]></Value>", "До и после"],
  ])("preserves the meaning of %s", (xml, expected) => {
    const parsed = importContentFromXML<{ Value: Parameters<typeof importStringOrNumberFromXML>[2] }>(xml)
    expect(importStringOrNumberFromXML(mockContextFromXML(), undefined, parsed.Value)).toBe(expected)
    expect(importStringOrNumberFromXML(mockContextFromXML(), undefined, parseStructuralXMLWithoutCompatibility(xml))).toBe(expected)
  })
})
