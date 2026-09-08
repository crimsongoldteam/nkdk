import { describe, expect, it } from "vitest"
import { mockContextFromXML, mockRule } from "../../../tests/mockContext"
import { importWebSocketClientHeadersFromXML } from "./fromXML"
import type { WebSocketClientHeadersXML } from "./types"
import { parseStructuralXMLWithoutCompatibility } from "../../../tests/structuralXML"

describe("importWebSocketClientHeadersFromXML", () => {
  it("preserves repeated structural header keys in source order", () => {
    const xml = '<Headers><xr:Item><xr:Value xsi:type="v8:KeyAndValue"><v8:Key xsi:type="xs:string">X-Test</v8:Key><v8:Value xsi:type="xs:string">first</v8:Value></xr:Value></xr:Item><xr:Item><xr:Value xsi:type="v8:KeyAndValue"><v8:Key xsi:type="xs:string">X-Test</v8:Key><v8:Value xsi:type="xs:string">second</v8:Value></xr:Value></xr:Item></Headers>'
    expect(importWebSocketClientHeadersFromXML(mockContextFromXML(), mockRule, parseStructuralXMLWithoutCompatibility(xml))).toEqual([{ Ключ: "X-Test", Значение: "first" }, { Ключ: "X-Test", Значение: "second" }])
  })

  it("reports a missing structural header value without reading compatibility", () => {
    const xml = '<Headers><xr:Item><xr:Value xsi:type="v8:KeyAndValue"><v8:Key xsi:type="xs:string">X-Test</v8:Key></xr:Value></xr:Item></Headers>'
    expect(() => importWebSocketClientHeadersFromXML(mockContextFromXML(), mockRule, parseStructuralXMLWithoutCompatibility(xml))).toThrow("отсутствует ключ или значение")
  })

  it.each([
    ["<Headers/>", undefined],
    ['<Headers xsi:type="xr:ValueList"/>', []],
    ['<Headers><xr:Item><xr:Value xsi:type="v8:KeyAndValue"><v8:Key xsi:type="xs:string">X-Test</v8:Key><v8:Value xsi:type="xs:string"/></xr:Value></xr:Item></Headers>', [{ Ключ: "X-Test", Значение: "" }]],
  ])("reads structural headers: %s", (xml, expected) => {
    expect(importWebSocketClientHeadersFromXML(mockContextFromXML(), mockRule, parseStructuralXMLWithoutCompatibility(xml))).toEqual(expected)
  })

  it("imports empty ValueList as empty array", () => {
    const xml: WebSocketClientHeadersXML = {
      "_xsi:type": "xr:ValueList",
    }

    const result = importWebSocketClientHeadersFromXML(mockContextFromXML(), mockRule, xml)

    expect(result).toEqual([])
  })

  it("preserves duplicate header keys", () => {
    const xml: WebSocketClientHeadersXML = {
      "_xsi:type": "xr:ValueList",
      "xr:Item": [
        {
          "xr:Presentation": "",
          "xr:CheckState": 0,
          "xr:Value": {
            "_xsi:type": "v8:KeyAndValue",
            "v8:Key": { "_xsi:type": "xs:string", "#text": "Authorization" },
            "v8:Value": { "_xsi:type": "xs:string", "#text": "first" },
          },
        },
        {
          "xr:Presentation": "",
          "xr:CheckState": 0,
          "xr:Value": {
            "_xsi:type": "v8:KeyAndValue",
            "v8:Key": { "_xsi:type": "xs:string", "#text": "Authorization" },
            "v8:Value": { "_xsi:type": "xs:string", "#text": "second" },
          },
        },
      ],
    }

    const result = importWebSocketClientHeadersFromXML(mockContextFromXML(), mockRule, xml)

    expect(result).toEqual([
      { Ключ: "Authorization", Значение: "first" },
      { Ключ: "Authorization", Значение: "second" },
    ])
  })
})
