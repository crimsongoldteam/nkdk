import { describe, expect, it } from "vitest"
import { exportElementToXML } from "~/metadata/orchestration"
import { fullPlannerField, minimalPlannerField } from "~/tests/fixtures/forms/plannerField/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportPlannerFieldToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/plannerField/full.xml")
    const xmlData = exportElementToXML({ context: mockContext, element: fullPlannerField })

    const result = xmlExport({ PlannerField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/plannerField/minimal.xml")
    const xmlData = exportElementToXML({ context: mockContext, element: minimalPlannerField })

    const result = xmlExport({ PlannerField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
