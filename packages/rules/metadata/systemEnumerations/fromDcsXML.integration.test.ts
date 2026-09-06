import { describe, expect, it } from "vitest"
import { importContentFromXML, parseXmlDocumentWithSaxes } from "@nkdk/runtime"
import { mockContextFromXML } from "../../tests/mockContext"
import { readAndParseXMLFixture } from "../../tests/readFixtureXML"
import { SystemEnumerationDcsValueRootXML } from "./dcsTypes"
import { importSystemEnumerationFromDcsXML } from "./fromDcsXML"
import { SystemEnumerationPropertyRule } from "./types"

describe("importSystemEnumerationFromDcsXML", () => {
  it("preserves the difference between empty typed and untyped values", () => {
    const rule: SystemEnumerationPropertyRule = { type: "SystemEnumeration", typeSE: "HorizontalAlign" }
    const context = mockContextFromXML()
    for (const structural of [false, true]) {
      const empty = parseXmlDocumentWithSaxes('<dcscor:value/>')
      expect(() => importSystemEnumerationFromDcsXML(context, rule, structural ? empty.roots[0]! : importContentFromXML<SystemEnumerationDcsValueRootXML>('<dcscor:value/>')))
        .toThrow("DCS SystemEnumeration: missing dcscor:value")
      const typed = parseXmlDocumentWithSaxes('<dcscor:value xsi:type="v8ui:HorizontalAlign"/>').roots[0]!
      expect(() => importSystemEnumerationFromDcsXML(context, rule, structural ? typed : { "dcscor:value": { "_xsi:type": "v8ui:HorizontalAlign" } }))
        .toThrow("DCS SystemEnumeration: invalid text node")
    }
  })

  it.each(["", ' xsi:type="v8ui:HorizontalAlign"'])("reads structural DCS enumeration %s", (attributes) => {
    const xml = parseXmlDocumentWithSaxes(`<dcscor:value${attributes}>Center</dcscor:value>`).roots[0]!
    Object.defineProperty(xml, "compatibilityValue", { get() { throw new Error("Compatibility XML must not be read") } })
    expect(importSystemEnumerationFromDcsXML(mockContextFromXML(), { type: "SystemEnumeration", typeSE: "HorizontalAlign" }, xml)).toBe("Center")
  })

  it("rejects a different structural enumeration type", () => {
    const xml = parseXmlDocumentWithSaxes('<dcscor:value xsi:type="v8ui:VerticalAlign">Center</dcscor:value>').roots[0]!
    expect(() => importSystemEnumerationFromDcsXML(mockContextFromXML(), { type: "SystemEnumeration", typeSE: "HorizontalAlign" }, xml))
      .toThrow("DCS SystemEnumeration: expected xsi:type")
  })

  it("should import DCS fragment to HorizontalAlign value", () => {
    const rule = {
      type: "SystemEnumeration",
      typeSE: "HorizontalAlign",
    } as SystemEnumerationPropertyRule

    const parsed = readAndParseXMLFixture<SystemEnumerationDcsValueRootXML>(import.meta.url, "dcs/horizontalAlign.xml")

    const result = importSystemEnumerationFromDcsXML(mockContextFromXML(), rule, parsed)

    expect(result).toEqual("Center")
  })
})
