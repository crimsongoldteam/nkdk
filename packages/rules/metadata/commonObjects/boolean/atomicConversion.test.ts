import { describe, expect, it } from "vitest"
import {
  compileBooleanAtomicConversion,
  metadataPropertyRule000,
} from "./atomicConversion"

describe("compileBooleanAtomicConversion", () => {
  const conversion = compileBooleanAtomicConversion({ rule: { type: "boolean" } })
  const context = {} as never

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
