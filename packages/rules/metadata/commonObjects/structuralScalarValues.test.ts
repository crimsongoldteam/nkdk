import { importContentFromXML } from "@nkdk/runtime"
import { describe, expect, it } from "vitest"
import { mockContextFromXML, mockRule } from "../../tests/mockContext"
import { parseStructuralXMLWithoutCompatibility } from "../../tests/structuralXML"
import { importDateTimeFromXML } from "./dateTime/fromXML"
import { importColorFromXML } from "./color/fromXML"
import { importUUIDFromXML } from "./uuid/fromXML"
import { importUserSettingsIDFromXML } from "./userSettingsID/fromXML"

describe("structural scalar values", () => {
  it.each([
    ["<Root/>", undefined],
    ["<Root>2026-09-06T00:00:00</Root>", "2026-09-06T00:00:00"],
    ['<Root xsi:type="xs:dateTime">0001-01-01T00:00:00</Root>', "0001-01-01T00:00:00"],
    ['<Root xsi:type="xs:dateTime"/>', "[object Object]"],
  ])("preserves date-time decoding %s", (xml, expected) => {
    const legacy = importContentFromXML<{ Root: string | { "#text"?: string; "_xsi:type"?: string } }>(xml).Root
    expect(importDateTimeFromXML(mockContextFromXML(), mockRule, legacy)).toEqual(expected)
    expect(importDateTimeFromXML(mockContextFromXML(), mockRule, parseStructuralXMLWithoutCompatibility(xml))).toEqual(expected)
  })

  it.each([
    ["", undefined],
    ["auto", undefined],
    ["web:Red", { type: "WebColor", value: "Red" }],
    ["#123456", { type: "Absolute", value: "#123456" }],
  ])("preserves color %s", (value, expected) => {
    const xml = `<Root>${value}</Root>`
    expect(importColorFromXML(mockContextFromXML(), mockRule, importContentFromXML<{ Root: string }>(xml).Root)).toEqual(expected)
    expect(importColorFromXML(mockContextFromXML(), mockRule, parseStructuralXMLWithoutCompatibility(xml))).toEqual(expected)
  })

  for (const [name, read] of [["uuid", importUUIDFromXML], ["userSettingsID", importUserSettingsIDFromXML]] as const) {
    it.each(["", "00000000-0000-0000-0000-000000000000", "12345678-1234-4234-9234-123456789abc"])(`preserves literal ${name}: %s`, value => {
      const xml = `<Root>${value}</Root>`
      expect(read(mockContextFromXML(), mockRule, importContentFromXML<{ Root: string }>(xml).Root)).toEqual(value || undefined)
      expect(read(mockContextFromXML(), mockRule, parseStructuralXMLWithoutCompatibility(xml))).toEqual(value || undefined)
    })
  }
})
