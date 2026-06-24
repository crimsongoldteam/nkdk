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

  it("imports explicit empty Synonym as empty i18n text", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlRootTag: "TabularSection",
      xmlString:
        '<TabularSection uuid="3cf6b85b-5422-44cc-bb0a-11d41703d9f5">' +
        "<Properties>" +
        "<Name>Исполнители</Name>" +
        "<Synonym/>" +
        "<Comment/>" +
        "<ToolTip/>" +
        "<FillChecking>DontCheck</FillChecking>" +
        "<Use>ForItem</Use>" +
        "<LineNumberLength>5</LineNumberLength>" +
        "</Properties>" +
        "<ChildObjects/>" +
        "</TabularSection>",
    })

    expect(result).toEqual([
      {
        itemType: "MetadataTabularSection",
        attributes: [],
        name: "Исполнители",
        synonym: { items: {} },
      },
    ])
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
