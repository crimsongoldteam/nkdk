import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importCommonAttributeContentFromYAML } from "./fromYAML"
import { CommonAttributeContent, CommonAttributeContentYAML } from "./types"

const fullYAML: CommonAttributeContentYAML = [
  {
    Объект: "ПланСчетов.ПланСчетовВсеСвойства",
    Использование: "Использовать",
    УсловноеРазделение: "",
  },
  {
    Объект: "Справочники.СправочникОбщиеРеквизиты",
    Использование: "Использовать",
    УсловноеРазделение: "",
  },
  {
    Объект: "ПланыВидовРасчета.ПланРасчетаВсеСвойства",
    Использование: "НеИспользовать",
    УсловноеРазделение: "",
  },
]

const full: CommonAttributeContent = [
  { metadata: "ChartOfAccounts.ПланСчетовВсеСвойства", use: "Use", conditionalSeparation: "" },
  { metadata: "Catalog.СправочникОбщиеРеквизиты", use: "Use", conditionalSeparation: "" },
  { metadata: "ChartOfCalculationTypes.ПланРасчетаВсеСвойства", use: "DontUse", conditionalSeparation: "" },
]

describe("importCommonAttributeContentFromYAML", () => {
  it("imports content items", () => {
    const result = importCommonAttributeContentFromYAML(mockContext, mockRule, fullYAML)

    expect(result).toEqual(full)
  })

  it("returns undefined when YAML is undefined", () => {
    const result = importCommonAttributeContentFromYAML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })
})
