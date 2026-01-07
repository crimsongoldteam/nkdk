import { describe, expect, it } from "vitest"
import { fullPlannerField, minimalPlannerField } from "~/tests/fixtures/forms/plannerField/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importPlannerFieldFromXML } from "./importFromXML"
import { PlannerFieldXML } from "./types"

describe("importPlannerFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importPlannerFieldFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ PlannerField: PlannerFieldXML }>("forms/plannerField/full.xml")

    const result = importPlannerFieldFromXML(mockСontext, xmlData.PlannerField)

    expect(result).toEqual(fullPlannerField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ PlannerField: PlannerFieldXML }>("forms/plannerField/minimal.xml")

    const result = importPlannerFieldFromXML(mockСontext, xmlData.PlannerField)

    expect(result).toEqual(minimalPlannerField)
  })
})


