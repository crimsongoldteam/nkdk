import { describe, expect, it } from "vitest"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { exportXDTOTypeNameToXML } from "./toXML"

const context = {} as ConfigurationContextWithExportToXML

describe("export XDTOTypeName to XML", () => {
  it("exports XML Schema namespace with xs prefix", () => {
    expect(
      exportXDTOTypeNameToXML(context, undefined, {
        namespace: "http://www.w3.org/2001/XMLSchema",
        name: "string",
      })
    ).toBe("xs:string")
  })

  it("exports v8 data/core namespace with v8 prefix", () => {
    expect(
      exportXDTOTypeNameToXML(context, undefined, {
        namespace: "http://v8.1c.ru/8.1/data/core",
        name: "Structure",
      })
    ).toBe("v8:Structure")
  })

  it("exports custom namespace with d6p1 declaration", () => {
    expect(
      exportXDTOTypeNameToXML(context, undefined, {
        namespace: "http://www.1c.ru/dmil",
        name: "DMILResponse",
      })
    ).toEqual({
      "#text": "d6p1:DMILResponse",
      "_xmlns:d6p1": "http://www.1c.ru/dmil",
    })
  })
})
