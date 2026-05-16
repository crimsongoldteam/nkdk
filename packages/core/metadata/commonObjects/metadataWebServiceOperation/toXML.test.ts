import { describe, expect, it } from "vitest"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { operationsWithXDTOTypeNamespace } from "./__fixtures__/data"
import "./register"

const rule = { type: "MetadataWebServiceOperations", xml: "Operation" } as const

describe("export MetadataWebServiceOperations to XML", () => {
  it("round-trips XDTO type namespace declarations from reference XML", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: operationsWithXDTOTypeNamespace,
      xmlRootTag: "Operation",
      path: "xdto-type-namespace.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports changed XDTO type names without reference namespace declarations", () => {
    const [{ parameters, ...operation }] = operationsWithXDTOTypeNamespace
    const { result } = testExportPropertyToXML({
      rule,
      value: [
        {
          ...operation,
          xdtoReturningValueType: "xs:string",
          parameters: parameters?.map((parameter) => ({
            ...parameter,
            xdtoValueType: "xs:token",
          })),
        },
      ],
      xmlRootTag: "Operation",
      path: "xdto-type-namespace.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toContain("<XDTOReturningValueType>xs:string</XDTOReturningValueType>")
    expect(result).toContain("<XDTOValueType>xs:token</XDTOValueType>")
    expect(result).not.toContain("xmlns:d4p1")
  })
})
