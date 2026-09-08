import { describe, expect, it } from "vitest"
import { mockContextToXML } from "../../../tests/mockContext"
import { readXMLFileAsString } from "../../../tests/readAndParseXMLFile"
import { xmlExport } from "@nkdk/runtime"
import { createYAMLPropertySource } from "../../ruleRuntime/property/fromYAMLToXML"
import { exportInternalInfoToXML } from "./toXML"

describe("exportInternalInfoToXML", () => {
  it.each([
    { fixture: "single.xml", items: [{ name: "CatalogTabularSection", category: "TabularSection" }] },
    { fixture: "multiple.xml", items: [
      { name: "CatalogTabularSection", category: "TabularSection" },
      { name: "CatalogTabularSectionRow", category: "TabularSectionRow" },
    ] },
  ])("exports $fixture through the current rule executor", ({ fixture, items }) => {
    const result = exportInternalInfoToXML({
      context: mockContextToXML(),
      value: undefined,
      source: createYAMLPropertySource({
        yaml: {}, itemName: "Лиды.Контакты",
        rule: { itemType: "InternalInfoProbe", properties: {} },
      }),
      rule: { type: "InternalInfo", items },
    })
    expect(xmlExport({ InternalInfo: result }, false)).toEqual(readXMLFileAsString(`internalInfo/${fixture}`))
  })
})
