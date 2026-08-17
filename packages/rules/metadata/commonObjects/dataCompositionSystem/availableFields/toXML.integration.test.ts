import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../ruleRuntime"
import { testAtomicToXML } from "../../../../tests/property/atomicToXML"
import { fullAvailableFields, selectedItemAvailableFields } from "./__fixtures__/data"
import "./types"
import { importFromYAML } from "@nkdk/runtime"
import { testAtomicFromYAML } from "../../../../tests/property/atomicFromYAML"

const rule: PropertyRule = {
  type: "AvailableFields",
}

describe("export available fields to XML", () => {
  it("exports full.xml", () => {
    const { expectedResult, result } = testAtomicToXML({
      rule,
      value: fullAvailableFields,
      xmlRootTag: "dcsset:selection",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports selected items", () => {
    const { expectedResult, result } = testAtomicToXML({
      rule,
      value: selectedItemAvailableFields,
      xmlRootTag: "dcsset:selection",
      path: "selected-item.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports payload of !xml/reference verbatim", () => {
    const value = testAtomicFromYAML({
      rule,
      value: importFromYAML("- !xml/reference НеизвестныйЭлемент\n- Поле: !xml/reference ДругойЭлемент\n  Использование: Истина\n"),
    })
    const { result } = testAtomicToXML({ rule, value })

    expect(result).toContain("<dcsset:field>НеизвестныйЭлемент</dcsset:field>")
    expect(result).toContain("<dcsset:field>ДругойЭлемент</dcsset:field>")
    expect(result).toContain("<dcsset:use>true</dcsset:use>")
  })
})
