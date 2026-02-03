import { describe, expect, it } from "vitest"
import { fullPlannerField, minimalPlannerField } from "~/tests/fixtures/forms/plannerField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportPlannerFieldToXML } from "./exportToXML"

describe("exportPlannerFieldToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportPlannerFieldToXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/plannerField/full.xml")
    const xmlData = exportPlannerFieldToXML(mockContext, mockRule, fullPlannerField)

    const result = xmlExport({ PlannerField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/plannerField/minimal.xml")
    const xmlData = exportPlannerFieldToXML(mockContext, mockRule, minimalPlannerField)

    const result = xmlExport({ PlannerField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
