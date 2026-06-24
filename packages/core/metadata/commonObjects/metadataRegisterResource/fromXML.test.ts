import { describe, expect, it } from "vitest"
import { resourcesFromXML } from "./__fixtures__/data"
import "./register"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"

const rule = { type: "MetadataRegisterResources", xml: "Resource" } as const

describe("import MetadataRegisterResources from XML", () => {
  it("imports register resources with shared field properties", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "resources.xml",
      xmlRootTag: "Resource",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(resourcesFromXML)
  })
})
