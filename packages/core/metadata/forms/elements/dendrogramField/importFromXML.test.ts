import { describe, expect, it } from "vitest"
import { fullDendrogramField, minimalDendrogramField } from "~/tests/fixtures/forms/dendrogramField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importDendrogramFieldFromXML } from "./importFromXML"
import { DendrogramFieldXML } from "./types"

describe("importDendrogramFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importDendrogramFieldFromXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ DendrogramField: DendrogramFieldXML }>("forms/dendrogramField/full.xml")

    const result = importDendrogramFieldFromXML(mockContext, mockRule, xmlData.DendrogramField)

    expect(result).toEqual(fullDendrogramField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ DendrogramField: DendrogramFieldXML }>("forms/dendrogramField/minimal.xml")

    const result = importDendrogramFieldFromXML(mockContext, mockRule, xmlData.DendrogramField)

    expect(result).toEqual(minimalDendrogramField)
  })
})
