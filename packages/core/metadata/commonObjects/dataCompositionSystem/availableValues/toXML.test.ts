import { describe, expect, it } from "vitest"
import { exportPropertyToXML } from "~/metadata/orchestration"
import { mockContextToXML } from "~/tests/mockContext"
import { nilAndBooleanAvailableValues, stringAvailableValues } from "./__fixtures__/data"

const rule = { type: "DcsAvailableValues", xml: "dcssch:availableValue" } as const

describe("export DcsAvailableValues to XML", () => {
  it("exports string values and presentations", () => {
    const result = exportPropertyToXML({
      context: mockContextToXML(),
      rule,
      value: stringAvailableValues,
    })

    expect(result).toEqual([
      {
        "dcssch:value": { "_xsi:type": "xs:string", "#text": "Выставлен" },
        "dcssch:presentation": {
          "_xsi:type": "v8:LocalStringType",
          "v8:item": [{ "v8:lang": "ru", "v8:content": "Выставлен" }],
        },
      },
      {
        "dcssch:value": { "_xsi:type": "xs:string", "#text": "Аннулирован" },
        "dcssch:presentation": {
          "_xsi:type": "v8:LocalStringType",
          "v8:item": [{ "v8:lang": "ru", "v8:content": "Аннулирован" }],
        },
      },
    ])
  })

  it("exports absent value as xsi:nil", () => {
    const result = exportPropertyToXML({
      context: mockContextToXML(),
      rule,
      value: nilAndBooleanAvailableValues,
    })

    expect(result).toEqual([
      { "dcssch:value": { "_xsi:nil": true } },
      { "dcssch:value": { "_xsi:type": "xs:boolean", "#text": "true" } },
    ])
  })

  it("preserves xs:string presentation from reference metadata", () => {
    const result = exportPropertyToXML({
      context: mockContextToXML(),
      rule,
      value: stringAvailableValues,
      referenceMetadata: [
        {
          itemType: "DcsAvailableValue",
          value: { type: "string", value: "Выставлен" },
          presentation: "Выставлен",
        },
      ],
    })

    expect(result[0]["dcssch:presentation"]).toEqual({
      "_xsi:type": "xs:string",
      "#text": "Выставлен",
    })
  })
})
