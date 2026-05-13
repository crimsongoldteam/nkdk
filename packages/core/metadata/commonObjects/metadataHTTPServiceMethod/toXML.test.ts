import { describe, expect, it } from "vitest"
import { methodsFromXML } from "./__fixtures__/data"
import "./register"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"

const rule = { type: "MetadataHTTPServiceMethods", xml: "Method" } as const

describe("export MetadataHTTPServiceMethods to XML", () => {
  it("round-trips GET and HEAD methods", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: methodsFromXML,
      xmlRootTag: "Method",
      path: "methods.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("restores GET when httpMethod is absent", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: [
        {
          itemType: "MetadataHTTPServiceMethod",
          name: "МетодБезHTTPМетода",
          handler: "МетодБезHTTPМетода",
        },
      ],
      xmlRootTag: "Method",
    })

    expect(result).toContain("<HTTPMethod>GET</HTTPMethod>")
  })
})
