import { describe, expect, it } from "vitest"
import { mockContextToXML, mockRule } from "~/tests/mockContext"
import { exportWebSocketClientHeadersToXML } from "./toXML"

describe("exportWebSocketClientHeadersToXML", () => {
  it("exports empty headers as typed ValueList", () => {
    const result = exportWebSocketClientHeadersToXML(mockContextToXML(), mockRule, [])

    expect(result).toEqual({
      "_xsi:type": "xr:ValueList",
    })
  })

  it("preserves duplicate header keys", () => {
    const result = exportWebSocketClientHeadersToXML(mockContextToXML(), mockRule, [
      { Ключ: "Authorization", Значение: "first" },
      { Ключ: "Authorization", Значение: "second" },
    ])

    expect(result).toEqual({
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
    })
  })
})
