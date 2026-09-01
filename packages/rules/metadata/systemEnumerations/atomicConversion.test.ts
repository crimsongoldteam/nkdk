import { describe, expect, it } from "vitest"

import { compileSystemEnumerationAtomicConversion } from "./atomicConversion"

describe("compileSystemEnumerationAtomicConversion", () => {
  const context = {} as never

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
