import { describe, expect, it } from "vitest"
import { fullPeriodField, minimalPeriodField } from "~/tests/fixtures/forms/periodField/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importPeriodFieldFromXML } from "./importFromXML"
import { PeriodFieldXML } from "./types"

describe("importPeriodFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importPeriodFieldFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ PeriodField: PeriodFieldXML }>("forms/periodField/full.xml")

    const result = importPeriodFieldFromXML(mockСontext, xmlData.PeriodField)

    expect(result).toEqual(fullPeriodField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ PeriodField: PeriodFieldXML }>("forms/periodField/minimal.xml")

    const result = importPeriodFieldFromXML(mockСontext, xmlData.PeriodField)

    expect(result).toEqual(minimalPeriodField)
  })
})

