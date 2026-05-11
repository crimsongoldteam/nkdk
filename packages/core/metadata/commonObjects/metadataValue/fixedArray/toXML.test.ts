import { describe, expect, it } from "vitest"
import { mockContext, mockContextFromXML } from "~/tests/mockContext"
import {
  refsWithNilFixedArray,
  singleStringFixedArray,
  twoRefsFixedArray,
} from "./__fixtures__/data"
import { exportFixedArrayToXML } from "./toXML"
import { importFixedArrayFromXML } from "./fromXML"

describe("exportFixedArrayToXML", () => {
  it("should export fixed array with two refs and round-trip via XML", () => {
    const xmlNode = exportFixedArrayToXML(mockContext, twoRefsFixedArray)
    const reimported = importFixedArrayFromXML(mockContextFromXML(), xmlNode)
    expect(reimported).toEqual(twoRefsFixedArray)
  })

  it("should export fixed array with single string and round-trip via XML", () => {
    const xmlNode = exportFixedArrayToXML(mockContext, singleStringFixedArray)
    const reimported = importFixedArrayFromXML(mockContextFromXML(), xmlNode)
    expect(reimported).toEqual(singleStringFixedArray)
  })

  it("should export fixed array with nil element and round-trip via XML", () => {
    const xmlNode = exportFixedArrayToXML(mockContext, refsWithNilFixedArray)
    expect(xmlNode["v8:Value"]).toEqual([
      { "_xsi:type": "xr:DesignTimeRef", "#text": "Enum.ХозяйственныеОперации.EnumValue.РеализацияКлиенту" },
      { "_xsi:nil": true },
      { "_xsi:type": "xr:DesignTimeRef", "#text": "Enum.ХозяйственныеОперации.EmptyRef" },
    ])

    const reimported = importFixedArrayFromXML(mockContextFromXML(), xmlNode)
    expect(reimported).toEqual(refsWithNilFixedArray)
  })
})
