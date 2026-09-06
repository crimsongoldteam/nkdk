import { describe, expect, it } from "vitest"
import { parseStructuralXMLWithoutCompatibility } from "../../../tests/structuralXML"
import { importBooleanFromXML } from "./fromXML"
import {
  compileBooleanAtomicConversion,
  metadataPropertyRule000,
} from "./atomicConversion"

describe("compileBooleanAtomicConversion", () => {
  const conversion = compileBooleanAtomicConversion({ rule: { type: "boolean" } })
  const context = {} as never

  it.each([
    ["<Value>true</Value>", true, "Истина"],
    ["<Value>false</Value>", false, "Ложь"],
    ['<Value xsi:type="xs:boolean">true</Value>', true, "Истина"],
    ["<Value/>", undefined, undefined],
    ["<Value>1</Value>", undefined, undefined],
  ])("uses the same structural boolean semantics: %s", (xml, metadataValue, representationValue) => {
    const value = parseStructuralXMLWithoutCompatibility(xml)
    expect(importBooleanFromXML(context, undefined, value)).toBe(metadataValue)
    expect(conversion.fromXMLToYAML({ context, value })).toEqual({ metadataValue, representationValue })
  })

  it.each([
    ["true", true, "Истина"],
    ["false", false, "Ложь"],
    [{ "#text": "true" }, true, "Истина"],
    [{ "#text": "false" }, false, "Ложь"],
  ])("объединяет XML %j в значение и YAML", (value, metadataValue, representationValue) => {
    expect(conversion.fromXMLToYAML?.({ context, value })).toEqual({
      metadataValue,
      representationValue,
    })
  })

  it.each([
    ["Истина", true],
    ["Ложь", false],
    [true, true],
    [false, false],
  ])("объединяет YAML %j в значение и XML", (value, expected) => {
    expect(conversion.fromYAMLToXML?.({ context, value })).toEqual({
      metadataValue: expected,
      representationValue: expected,
    })
  })

  it("объявляет единую операцию для типа boolean", () => {
    expect(metadataPropertyRule000).toEqual({
      type: "boolean",
      operation: "compileAtomicConversion",
      handler: compileBooleanAtomicConversion,
    })
  })
})
