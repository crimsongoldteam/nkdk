import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportCommonAttributeContentToYAML } from "./toYAML"
import { CommonAttributeContent, CommonAttributeContentYAML } from "./types"

const full: CommonAttributeContent = [
  { metadata: "ChartOfAccounts.ПланСчетовВсеСвойства", use: "Use", conditionalSeparation: "" },
  { metadata: "Catalog.СправочникОбщиеРеквизиты", use: "Use", conditionalSeparation: "" },
  { metadata: "ChartOfCalculationTypes.ПланРасчетаВсеСвойства", use: "DontUse", conditionalSeparation: "" },
]

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

describe("exportCommonAttributeContentToYAML", () => {
  it("exports content items", () => {
    const result = exportCommonAttributeContentToYAML(mockContext, mockRule, full)

    expect(result).toEqual(fullYAML)
  })

  it("returns undefined when model is undefined", () => {
    const result = exportCommonAttributeContentToYAML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })
})
