import { describe, expect, it } from "vitest"

import { compileSystemEnumerationAtomicConversion } from "./atomicConversion"
import { importSystemEnumerationFromXML } from "./fromXML"
import { parseStructuralXMLWithoutCompatibility } from "../../tests/structuralXML"
import { mockContext } from "../../tests/mockContext"
import type { SystemEnumerationPropertyRule } from "./types"

describe("compileSystemEnumerationAtomicConversion", () => {
  const context = {} as never

  it.each([
    ["<Value/>", undefined, undefined],
    ['<Value xsi:type="v8ui:CheckBoxType"/>', undefined, undefined],
    ["<Value>Switcher</Value>", "Switch", "Выключатель"],
    ['<Value xsi:type="v8ui:CheckBoxType">Switcher</Value>', "Switch", "Выключатель"],
  ])("reads ordinary and atomic enumeration from structural XML: %s", (xml, expected, yaml) => {
    const rule: SystemEnumerationPropertyRule = { type: "SystemEnumeration", typeSE: "CheckBoxType" }
    const value = parseStructuralXMLWithoutCompatibility(xml)
    expect(importSystemEnumerationFromXML(mockContext, rule, value)).toBe(expected)
    expect(compileSystemEnumerationAtomicConversion({ rule }).fromXMLToYAML({ context, value })).toEqual({ metadataValue: expected, representationValue: yaml })
  })

  it("преобразует обычное значение в обоих направлениях", () => {
    const conversion = compileSystemEnumerationAtomicConversion({
      rule: { type: "SystemEnumeration", typeSE: "ButtonRepresentation" } as never,
    })

    expect(conversion.fromXMLToYAML({ context, value: "Text" })).toEqual({
      metadataValue: "Text",
      representationValue: "Текст",
    })
    expect(conversion.fromYAMLToXML({ context, value: "Текст" })).toEqual({
      metadataValue: "Text",
      representationValue: "Text",
    })
  })

  it("компилирует XML-псевдонимы", () => {
    const conversion = compileSystemEnumerationAtomicConversion({
      rule: { type: "SystemEnumeration", typeSE: "CheckBoxType" } as never,
    })

    expect(conversion.fromXMLToYAML({ context, value: { "#text": "Switcher" } })).toEqual({
      metadataValue: "Switch",
      representationValue: "Выключатель",
    })
    expect(conversion.fromYAMLToXML({ context, value: "Выключатель" })).toEqual({
      metadataValue: "Switch",
      representationValue: "Switcher",
    })
  })

  it("сохраняет отсутствие и неизвестное значение как прежняя цепочка", () => {
    const conversion = compileSystemEnumerationAtomicConversion({
      rule: { type: "SystemEnumeration", typeSE: "ButtonRepresentation" } as never,
    })

    expect(conversion.fromXMLToYAML({ context, value: undefined })).toEqual({
      metadataValue: undefined,
      representationValue: undefined,
    })
    expect(conversion.fromYAMLToXML({ context, value: "Неизвестно" })).toEqual({
      metadataValue: undefined,
      representationValue: undefined,
    })
  })

  it("принимает уже подготовленное внутреннее значение XML-default", () => {
    const conversion = compileSystemEnumerationAtomicConversion({
      rule: { type: "SystemEnumeration", typeSE: "CheckBoxType" } as never,
    })

    expect(conversion.fromYAMLToXML({ context, value: "Auto" })).toEqual({
      metadataValue: "Auto",
      representationValue: "Auto",
    })
  })
})
