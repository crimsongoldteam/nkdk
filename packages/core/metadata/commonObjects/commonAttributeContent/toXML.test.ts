import { describe, expect, it } from "vitest"
import { mockContextToXML, mockRule } from "~/tests/mockContext"
import { exportCommonAttributeContentToXML } from "./toXML"
import { CommonAttributeContent, CommonAttributeContentXML } from "./types"

const full: CommonAttributeContent = [
  { metadata: "ChartOfAccounts.ПланСчетовВсеСвойства", use: "Use", conditionalSeparation: "" },
  { metadata: "Catalog.СправочникОбщиеРеквизиты", use: "Use", conditionalSeparation: "" },
  { metadata: "ChartOfCalculationTypes.ПланРасчетаВсеСвойства", use: "DontUse", conditionalSeparation: "" },
]

const fullXML: CommonAttributeContentXML = {
  "xr:Item": [
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
  ],
}

describe("exportCommonAttributeContentToXML", () => {
  it("exports content items", () => {
    const result = exportCommonAttributeContentToXML(mockContextToXML(), mockRule, full)

    expect(result).toEqual(fullXML)
  })

  it("returns undefined when model is undefined", () => {
    const result = exportCommonAttributeContentToXML(mockContextToXML(), mockRule, undefined)

    expect(result).toBeUndefined()
  })
})
