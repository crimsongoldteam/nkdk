import { describe, expect, it } from "vitest"
import { urlTemplatesFromXML } from "./__fixtures__/data"
import "./register"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"

const rule = { type: "MetadataHTTPServiceURLTemplates", xml: "URLTemplate" } as const

describe("import MetadataHTTPServiceURLTemplates from XML", () => {
  it("imports URL template with nested methods", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "urlTemplates.xml",
      xmlRootTag: "URLTemplate",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(urlTemplatesFromXML)
  })
})
