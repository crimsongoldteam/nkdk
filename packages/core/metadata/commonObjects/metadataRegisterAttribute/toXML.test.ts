import { describe, expect, it } from "vitest"
import { attributesFromXML } from "./__fixtures__/data"
import "./register"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"

const rule = { type: "MetadataRegisterAttributes", xml: "Attribute" } as const

describe("export MetadataRegisterAttributes to XML", () => {
  it("round-trips register attributes", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: attributesFromXML,
      xmlRootTag: "Attribute",
      path: "attributes.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
