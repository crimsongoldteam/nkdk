import { describe, expect, it } from "vitest"
import { attributesFromXML } from "./__fixtures__/data"
import "./register"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"

const rule = { type: "MetadataRegisterAttributes", xml: "Attribute" } as const

describe("import MetadataRegisterAttributes from XML", () => {
  it("imports register attributes with shared field properties", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "attributes.xml",
      xmlRootTag: "Attribute",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(attributesFromXML)
  })
})
