import { describe, expect, it } from "vitest"
import { fullFromXML, minimalFromXML } from "./__fixtures__/data"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"

const rule = { type: "MetadataTabularSections", xml: "TabularSection" } as const

describe("import MetadataTabularSections from XML", () => {
  it("should import full", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag: "TabularSection",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(fullFromXML)
  })

  it("should import minimal", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "minimal.xml",
      xmlRootTag: "TabularSection",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(minimalFromXML)
  })

  it("should return undefined when data is undefined", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlString: "<Root/>",
      xmlRootTag: "Root",
    })
    expect(result).toBeUndefined()
  })
})
