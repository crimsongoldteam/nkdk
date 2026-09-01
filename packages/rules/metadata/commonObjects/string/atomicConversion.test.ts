import { describe, expect, it } from "vitest"

import { compileStringAtomicConversion } from "./atomicConversion"

describe("compileStringAtomicConversion", () => {
  const conversion = compileStringAtomicConversion({ rule: { type: "string" } })
  const context = {} as never

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
