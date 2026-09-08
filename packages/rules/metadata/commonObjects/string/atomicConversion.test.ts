import { describe, expect, it } from "vitest"

import { compileStringAtomicConversion } from "./atomicConversion"
import { importStringFromXML } from "./fromXML"
import { parseStructuralXMLWithoutCompatibility } from "../../../tests/structuralXML"
import { mockContext } from "../../../tests/mockContext"

describe("compileStringAtomicConversion", () => {
  const conversion = compileStringAtomicConversion({ rule: { type: "string" } })
  const context = {} as never

  it("preserves the existing null contracts at the two public boundaries", () => {
    expect(() => importStringFromXML(mockContext, undefined, null!)).toThrow(TypeError)
    expect(conversion.fromXMLToYAML({ context, value: null })).toEqual({ metadataValue: "null", representationValue: "null" })
  })

  it.each([
    ["<Value/>", undefined],
    ["<Value><![CDATA[]]></Value>", undefined],
    ['<Value xsi:type="xs:string"/>', undefined],
    ['<Value xsi:type="xs:string">Текст</Value>', "Текст"],
    ["<Value>До<![CDATA[ и после]]></Value>", "До и после"],
    ["<Value><Child>Не текст родителя</Child></Value>", undefined],
  ])("reads ordinary and atomic string from structural XML: %s", (xml, expected) => {
    const value = parseStructuralXMLWithoutCompatibility(xml)
    expect(importStringFromXML(mockContext, undefined, value)).toBe(expected)
    expect(conversion.fromXMLToYAML({ context, value })).toEqual({ metadataValue: expected, representationValue: expected })
  })

  it.each([
    ["текст", "текст"],
    [42, "42"],
    [{ "#text": "значение" }, "значение"],
    [{ "_xsi:type": "xs:string", "#text": "типизировано" }, "типизировано"],
  ])("объединяет XML %j в строку YAML", (value, expected) => {
    expect(conversion.fromXMLToYAML({ context, value })).toEqual({
      metadataValue: expected,
      representationValue: expected,
    })
  })

  it("не превращает XML-объект без #text в строку", () => {
    expect(conversion.fromXMLToYAML({ context, value: { "_xsi:type": "xs:string" } })).toEqual({
      metadataValue: undefined,
      representationValue: undefined,
    })
  })

  it.each(["текст", 42, undefined])("сохраняет YAML %j для XML без неявного приведения", (value) => {
    expect(conversion.fromYAMLToXML({ context, value })).toEqual({
      metadataValue: value,
      representationValue: value,
    })
  })
})
