import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import { fullPlannerField, minimalPlannerField } from "~/tests/fixtures/forms/plannerField/data"
import { mockContextFromXML } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importPlannerFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "PlannerField",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ PlannerField: ElementXML }>("forms/plannerField/full.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "PlannerField",
      xml: xmlData.PlannerField,
    })

    expect(result).toEqual(fullPlannerField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ PlannerField: ElementXML }>("forms/plannerField/minimal.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "PlannerField",
      xml: xmlData.PlannerField,
    })

    expect(result).toEqual(minimalPlannerField)
  })
})
