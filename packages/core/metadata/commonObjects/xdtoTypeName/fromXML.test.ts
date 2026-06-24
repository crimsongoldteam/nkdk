import { describe, expect, it } from "vitest"
import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { importXDTOTypeNameFromXML } from "./fromXML"

const context = { fromXML: { forReference: false } } as ConfigurationContextFromXML

describe("import XDTOTypeName from XML", () => {
  it("imports QName object with namespace declaration as expanded name", () => {
    const result = importXDTOTypeNameFromXML(context, undefined, {
      "#text": "d6p1:DMILResponse",
      "_xmlns:d6p1": "http://www.1c.ru/dmil",
    })

    expect(result).toEqual({
      namespace: "http://www.1c.ru/dmil",
      name: "DMILResponse",
    })
  })

  it("imports xs prefix as XML Schema namespace", () => {
    const result = importXDTOTypeNameFromXML(context, undefined, "xs:string")

    expect(result).toEqual({
      namespace: "http://www.w3.org/2001/XMLSchema",
      name: "string",
    })
  })

  it("imports v8 prefix as data/core namespace", () => {
    const result = importXDTOTypeNameFromXML(context, undefined, "v8:Structure")

    expect(result).toEqual({
      namespace: "http://v8.1c.ru/8.1/data/core",
      name: "Structure",
    })
  })

  it("fails on unknown prefix without namespace declaration", () => {
    expect(() => importXDTOTypeNameFromXML(context, undefined, "d6p1:DMILResponse")).toThrow(
      "Unknown XDTO type namespace prefix: d6p1"
    )
  })
})
