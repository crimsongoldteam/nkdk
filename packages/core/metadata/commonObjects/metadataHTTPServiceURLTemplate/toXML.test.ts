import { describe, expect, it } from "vitest"
import { urlTemplatesFromXML } from "./__fixtures__/data"
import "./register"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"

const rule = { type: "MetadataHTTPServiceURLTemplates", xml: "URLTemplate" } as const

describe("export MetadataHTTPServiceURLTemplates to XML", () => {
  it("round-trips URL template with nested methods", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: urlTemplatesFromXML,
      xmlRootTag: "URLTemplate",
      path: "urlTemplates.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
