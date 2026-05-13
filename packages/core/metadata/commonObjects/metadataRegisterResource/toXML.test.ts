import { describe, expect, it } from "vitest"
import { resourcesFromXML } from "./__fixtures__/data"
import "./register"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"

const rule = { type: "MetadataRegisterResources", xml: "Resource" } as const

describe("export MetadataRegisterResources to XML", () => {
  it("round-trips register resources", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: resourcesFromXML,
      xmlRootTag: "Resource",
      path: "resources.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
