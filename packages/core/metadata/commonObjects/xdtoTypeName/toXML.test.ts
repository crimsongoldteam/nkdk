import { describe, expect, it } from "vitest"
import { ConfigurationContextWithExportToXML } from "../../context/types"
import { exportXDTOTypeNameToXML } from "./toXML"
import {
  MetadataWebServiceOperationRules,
  MetadataWebServiceParameterRules,
} from "../metadataWebServiceOperation/rules"

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

  it.each([
    {
      rule: MetadataWebServiceOperationRules.properties.xdtoReturningValueType,
      xml: "XDTOReturningValueType",
      prefix: "d6p1",
    },
    {
      rule: MetadataWebServiceParameterRules.properties.xdtoValueType,
      xml: "XDTOValueType",
      prefix: "d8p1",
    },
  ] as const)("exports custom namespace for $xml with $prefix", ({ rule, prefix }) => {
    expect(
      exportXDTOTypeNameToXML(context, rule, {
        namespace: "http://www.1c.ru/dmil",
        name: "DMILResponse",
      })
    ).toEqual({
      "#text": `${prefix}:DMILResponse`,
      [`_xmlns:${prefix}`]: "http://www.1c.ru/dmil",
    })
  })
})
