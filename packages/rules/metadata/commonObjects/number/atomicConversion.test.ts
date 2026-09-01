import { describe, expect, it } from "vitest"

import { compileNumberAtomicConversion } from "./atomicConversion"

describe("compileNumberAtomicConversion", () => {
  const context = {} as never

  it.each([
    [42, 42],
    ["42", 42],
    [{ "#text": "42" }, 42],
    [{ "_xsi:type": "xs:decimal", "#text": "42" }, 42],
    [{ "_xsi:type": "xs:string", "#text": "42" }, 42],
  ])("объединяет XML %j в число YAML", (value, expected) => {
    const conversion = compileNumberAtomicConversion({ rule: { type: "number" } })
    expect(conversion.fromXMLToYAML({ context, value })).toEqual({
      metadataValue: expected,
      representationValue: expected,
    })
  })

  it.each([undefined, "", { "_xsi:type": "xs:decimal" }])(
    "сохраняет пустое XML-значение %j",
    (value) => {
      const conversion = compileNumberAtomicConversion({ rule: { type: "number" } })
      expect(conversion.fromXMLToYAML({ context, value })).toEqual({
        metadataValue: undefined,
        representationValue: undefined,
      })
    },
  )

  it("сохраняет обычное число и числовую строку из YAML", () => {
    const conversion = compileNumberAtomicConversion({ rule: { type: "number" } })
    expect(conversion.fromYAMLToXML({ context, value: 42 })).toEqual({
      metadataValue: 42,
      representationValue: 42,
    })
    expect(conversion.fromYAMLToXML({ context, value: "42" })).toEqual({
      metadataValue: "42",
      representationValue: "42",
    })
  })

  it.each([
    [true, "xs:decimal"],
    ["xs:decimal", "xs:decimal"],
    ["xs:string", "xs:string"],
  ] as const)("компилирует typedXML %j", (typedXML, xsiType) => {
    const conversion = compileNumberAtomicConversion({
      rule: { type: "number", typedXML } as never,
    })
    expect(conversion.fromYAMLToXML({ context, value: 42 })).toEqual({
      metadataValue: 42,
      representationValue: { "_xsi:type": xsiType, "#text": "42" },
    })
  })
})
