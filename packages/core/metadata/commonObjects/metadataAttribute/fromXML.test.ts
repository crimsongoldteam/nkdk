import { describe, expect, it } from "vitest"
import { documentFromXML, fullFromXML, minimalFromXML, multipleFromXML } from "./__fixtures__/data"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"

const rule = { type: "MetadataAttributes", xml: "Attribute" } as const

describe("import MetadataAttributes from XML", () => {
  it("should import minimal", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "minimal.xml",
      xmlRootTag: "Attribute",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(minimalFromXML)
  })

  it("should import multiple attributes", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "multiple.xml",
      xmlRootTag: "Attribute",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(multipleFromXML)
  })

  it("should import full", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag: "Attribute",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(fullFromXML)
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

describe("import MetadataDocumentAttributes from XML", () => {
  const documentRule = { type: "MetadataDocumentAttributes", xml: "Attribute" } as const

  it("should import document", () => {
    const result = testImportPropertyFromXML({
      rule: documentRule,
      path: "document.xml",
      xmlRootTag: "Attribute",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(documentFromXML)
  })
})
