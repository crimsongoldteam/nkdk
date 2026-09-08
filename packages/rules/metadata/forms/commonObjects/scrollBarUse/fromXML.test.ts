import { describe, expect, it } from "vitest"
import { ConfigurationContextFromXML } from "@nkdk/runtime"
import { PropertyRule, importPropertyFromXML } from "../../../ruleRuntime"
import { parseStructuralXMLWithoutCompatibility } from "../../../../tests/structuralXML"

describe("importScrollBarUseFromXML (ScrollBarUseBoolean)", () => {
  const context = {
    fromXML: {},
  } as unknown as ConfigurationContextFromXML

  const rule = {
    type: "ScrollBarUseBoolean",
  } as PropertyRule

  it("returns undefined for undefined and null", () => {
    expect(importPropertyFromXML({ context, rule, value: undefined })).toBeUndefined()
    expect(importPropertyFromXML({ context, rule, value: null })).toBeUndefined()
  })

  it.each([["true", "UseAlways"], ["false", "DontUse"], ["unknown", undefined]])(
    "читает XML-узел без объектного представления: %s", (text, expected) => {
      const value = parseStructuralXMLWithoutCompatibility(`<Use>${text}</Use>`)
      expect(importPropertyFromXML({ context, rule, value })).toBe(expected)
    },
  )

  it("converts true / 'true' to UseAlways", () => {
    expect(importPropertyFromXML({ context, rule, value: true })).toBe("UseAlways")
    expect(importPropertyFromXML({ context, rule, value: "true" })).toBe("UseAlways")
  })

  it("converts false / 'false' to DontUse", () => {
    expect(importPropertyFromXML({ context, rule, value: false })).toBe("DontUse")
    expect(importPropertyFromXML({ context, rule, value: "false" })).toBe("DontUse")
  })

  it("returns undefined for unknown values", () => {
    expect(importPropertyFromXML({ context, rule, value: "unknown" })).toBeUndefined()
    expect(importPropertyFromXML({ context, rule, value: 123 as unknown as boolean })).toBeUndefined()
  })
})
