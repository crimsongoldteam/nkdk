import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import { fullPlannerField, minimalPlannerField } from "~/metadata/forms/elements/plannerField/__fixtures__/data"
import { mockContextFromXML } from "~/tests/mockContext"

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
    const xmlData = readAndParseXMLFixture<{ PlannerField: ElementXML }>(import.meta.url, "full.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "PlannerField",
      xml: xmlData.PlannerField,
    })

    expect(result).toEqual(fullPlannerField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFixture<{ PlannerField: ElementXML }>(import.meta.url, "minimal.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "PlannerField",
      xml: xmlData.PlannerField,
    })

    expect(result).toEqual(minimalPlannerField)
  })
})
