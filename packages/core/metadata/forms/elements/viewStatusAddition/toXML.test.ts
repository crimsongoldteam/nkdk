import { describe, expect, it } from "vitest"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportPropertyToXML } from "~/metadata/metadataFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { fullViewStatusAddition } from "~/tests/fixtures/forms/viewStatusAddition/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

const rule: PropertyRule = { type: "ViewStatusAddition" }

describe("exportViewStatusAdditionToXML", () => {
  it("should return default when data is undefined", () => {
    const context: ConfigurationContext = {
      ...mockContext,
      elementsTree: [{ name: "КакойТоЭлемент", itemType: "Table" }],
    }
    const expectedResult = readXMLFileAsString("forms/viewStatusAddition/minimal.xml")

    const xmlData = exportPropertyToXML({
      context: context,
      rule: rule,
      value: undefined,
    })

    const result = xmlExport({ ViewStatusAddition: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should return all fields to XML", () => {
    const context: ConfigurationContext = {
      ...mockContext,
      elementsTree: [{ name: "КакойТоЭлемент", itemType: "Table" }],
    }
    const expectedResult = readXMLFileAsString("forms/viewStatusAddition/full.xml").trimEnd()

    const xmlData = exportPropertyToXML({
      context: context,
      rule: rule,
      value: fullViewStatusAddition,
    })

    const result = xmlExport({ ViewStatusAddition: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
