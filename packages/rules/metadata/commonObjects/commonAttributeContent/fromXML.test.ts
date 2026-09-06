import { describe, expect, it } from "vitest"
import { mockContextFromXML, mockRule } from "../../../tests/mockContext"
import { importCommonAttributeContentFromXML } from "./fromXML"
import { CommonAttributeContent, CommonAttributeContentItemXML, CommonAttributeContentXML } from "./types"
import { parseStructuralXMLWithoutCompatibility } from "../../../tests/structuralXML"

const fullXMLItems: CommonAttributeContentItemXML[] = [
  {
    "xr:Metadata": "ChartOfAccounts.ПланСчетовВсеСвойства",
    "xr:Use": "Use",
    "xr:ConditionalSeparation": "",
  },
  {
    "xr:Metadata": "Catalog.СправочникОбщиеРеквизиты",
    "xr:Use": "Use",
    "xr:ConditionalSeparation": "",
  },
  {
    "xr:Metadata": "ChartOfCalculationTypes.ПланРасчетаВсеСвойства",
    "xr:Use": "DontUse",
    "xr:ConditionalSeparation": "",
  },
]

const fullXML: CommonAttributeContentXML = { "xr:Item": fullXMLItems }

const full: CommonAttributeContent = [
  { metadata: "ChartOfAccounts.ПланСчетовВсеСвойства", use: "Use", conditionalSeparation: "" },
  { metadata: "Catalog.СправочникОбщиеРеквизиты", use: "Use", conditionalSeparation: "" },
  { metadata: "ChartOfCalculationTypes.ПланРасчетаВсеСвойства", use: "DontUse", conditionalSeparation: "" },
]

describe("importCommonAttributeContentFromXML", () => {
  it.each([
    ["<Content/>", undefined],
    ["<Content><xr:Item/></Content>", undefined],
    ['<Content><xr:Item><xr:Metadata>Catalog.А</xr:Metadata><xr:Use>Use</xr:Use></xr:Item><xr:Item><xr:Metadata>Catalog.Б</xr:Metadata><xr:Use>DontUse</xr:Use><xr:ConditionalSeparation>yes</xr:ConditionalSeparation></xr:Item></Content>', [{ metadata: "Catalog.А", use: "Use", conditionalSeparation: "" }, { metadata: "Catalog.Б", use: "DontUse", conditionalSeparation: "yes" }]],
  ])("reads structural attribute content: %s", (xml, expected) => {
    expect(importCommonAttributeContentFromXML(mockContextFromXML(), mockRule, parseStructuralXMLWithoutCompatibility(xml))).toEqual(expected)
  })

  it("imports content items", () => {
    const result = importCommonAttributeContentFromXML(mockContextFromXML(), mockRule, fullXML)

    expect(result).toEqual(full)
  })

  it("imports single content item", () => {
    const result = importCommonAttributeContentFromXML(mockContextFromXML(), mockRule, {
      "xr:Item": fullXMLItems[0],
    })

    expect(result).toEqual([full[0]])
  })

  it("returns undefined when XML is undefined", () => {
    const result = importCommonAttributeContentFromXML(mockContextFromXML(), mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("returns undefined when XML has no items", () => {
    const result = importCommonAttributeContentFromXML(mockContextFromXML(), mockRule, {})

    expect(result).toBeUndefined()
  })
})
