import { describe, expect, it } from "vitest"
import { mockContextFromXML, mockRule } from "../../../tests/mockContext"
import { importChildTemplateNamesFromXML } from "./fromXML"

describe("importChildTemplateNamesFromXML", () => {
  it("возвращает undefined при xml = undefined", () => {
    expect(importChildTemplateNamesFromXML(mockContextFromXML(), mockRule, undefined)).toBeUndefined()
  })

  it("возвращает undefined при xml = null", () => {
    expect(importChildTemplateNamesFromXML(mockContextFromXML(), mockRule, null)).toBeUndefined()
  })

  it("возвращает undefined при пустом массиве", () => {
    expect(importChildTemplateNamesFromXML(mockContextFromXML(), mockRule, [])).toBeUndefined()
  })

  it("возвращает массив имён макетов при xml = массив", () => {
    expect(importChildTemplateNamesFromXML(mockContextFromXML(), mockRule, ["Макет", "МакетПечати"])).toEqual([
      "Макет",
      "МакетПечати",
    ])
  })

  it("оборачивает одиночную строку в массив", () => {
    expect(importChildTemplateNamesFromXML(mockContextFromXML(), mockRule, "Макет")).toEqual(["Макет"])
  })
})
