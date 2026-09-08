import { describe, expect, it } from "vitest"
import { accountingRegisterStandardAttributeTypeLink, catalogTabularAttributeTypeLink } from "./__fixtures__/data"
import { PropertyRule } from "../../ruleRuntime"
import { testImportPropertyFromXML } from "../../../tests/property/importPropertyFromXML"
import { readXMLFixtureAsString } from "../../../tests/readFixtureXML"
import { parseStructuralXMLWithoutCompatibility } from "../../../tests/structuralXML"
import { mockContextFromXML } from "../../../tests/mockContext"
import { importTypeLinkFromXML } from "./fromXML"
import { xmlFixtureValue as importContentFromXML } from "../../../tests/xmlFixtureValue"
import type { TypeLinkXML } from "./types"

const rule: PropertyRule = {
  type: "TypeLink",
}

describe("import TypeLink from XML", () => {
  it("rejects an empty untyped path rather than inventing a string", () => {
    const xml = "<TypeLink><xr:DataPath/></TypeLink>"
    expect(() => importTypeLinkFromXML(mockContextFromXML(), rule, importContentFromXML<{ TypeLink: TypeLinkXML }>(xml).TypeLink)).toThrow()
    expect(() => importTypeLinkFromXML(mockContextFromXML(), rule, parseStructuralXMLWithoutCompatibility(xml))).toThrow()
  })

  it("does not replace a missing typed path text with an empty string", () => {
    const source = parseStructuralXMLWithoutCompatibility('<TypeLink><xr:DataPath xsi:type="xs:string"/></TypeLink>')
    expect(importTypeLinkFromXML(mockContextFromXML(), rule, source)).toEqual({ dataPath: undefined, linkItem: 0 })
  })

  it.each(["<TypeLink/>", "<TypeLink><![CDATA[]]></TypeLink>"])("keeps empty structural link %s absent", (xml) => {
    expect(importTypeLinkFromXML(mockContextFromXML(), rule, parseStructuralXMLWithoutCompatibility(xml))).toBeUndefined()
  })

  it.each([
    ["simple.xml", catalogTabularAttributeTypeLink],
    ["withNumericLinkItem.xml", accountingRegisterStandardAttributeTypeLink],
  ])("imports structural %s", (path, expected) => {
    const source = parseStructuralXMLWithoutCompatibility(readXMLFixtureAsString(import.meta.url, path))
    expect(importTypeLinkFromXML(mockContextFromXML(), rule, source)).toEqual(expected)
  })

  it("imports simple.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "simple.xml",
      xmlRootTag: "TypeLink",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(catalogTabularAttributeTypeLink)
  })

  it("imports withNumericLinkItem.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "withNumericLinkItem.xml",
      xmlRootTag: "TypeLink",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(accountingRegisterStandardAttributeTypeLink)
  })
})
