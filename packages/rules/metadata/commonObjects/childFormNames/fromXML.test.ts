import { describe, expect, it } from "vitest"
import { mockContextFromXML, mockRule } from "../../../tests/mockContext"
import { importChildFormNamesFromXML } from "./fromXML"

describe("importChildFormNamesFromXML", () => {
  it("возвращает undefined при xml = undefined", () => {
    expect(importChildFormNamesFromXML(mockContextFromXML(), mockRule, undefined)).toBeUndefined()
  })

  it("возвращает undefined при xml = null", () => {
    expect(importChildFormNamesFromXML(mockContextFromXML(), mockRule, null)).toBeUndefined()
  })

  it("возвращает undefined при пустом массиве", () => {
    expect(importChildFormNamesFromXML(mockContextFromXML(), mockRule, [])).toBeUndefined()
  })

  it("возвращает массив имён форм при xml = массив", () => {
    expect(importChildFormNamesFromXML(mockContextFromXML(), mockRule, ["ФормаЭлемента", "ФормаСписка"])).toEqual([
      "ФормаЭлемента",
      "ФормаСписка",
    ])
  })

  it("оборачивает одиночную строку в массив", () => {
    expect(importChildFormNamesFromXML(mockContextFromXML(), mockRule, "ФормаЭлемента")).toEqual(["ФормаЭлемента"])
  })
})
