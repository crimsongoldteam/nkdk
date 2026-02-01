import { describe, expect, it } from "vitest"
import { fullFormParameters } from "~/tests/fixtures/formParameter/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importFormParametersFromXML } from "./importFromXML"
import { FormParametersXML } from "./types"

describe("importFormParametersFromXML", () => {
  it("should return undefined for undefined input", () => {
    const result = importFormParametersFromXML(mockContext, undefined)
    expect(result).toBeUndefined()
  })

  it("should import form parameters correctly", () => {
    const xmlData = readAndParseXMLFile<{ Parameter: FormParametersXML }>("formParameter/full.xml")
    const result = importFormParametersFromXML(mockContext, xmlData.Parameter)
    expect(result).toEqual(fullFormParameters)
  })
})
