import { describe, expect, it } from "vitest"
import { multipleChoiceParameterLinks } from "./__fixtures__/multiple"
import { singleChoiceParameterLinks } from "./__fixtures__/single"
import { withStringDataPathChoiceParameterLinks } from "./__fixtures__/withStringDataPath"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { readXMLFixtureAsString } from "../../../tests/readFixtureXML"
import { xmlExport } from "../../../xml/export/exporter"
import { exportChoiceParameterLinksToXML } from "./toXML"

describe("exportChoiceParameterLinksToXML", () => {
  it("should return undefined for undefined input", () => {
    const result = exportChoiceParameterLinksToXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should return undefined for empty array", () => {
    const result = exportChoiceParameterLinksToXML(mockContext, mockRule, [])

    expect(result).toBeUndefined()
  })

  it("should export ChoiceParameterLinks with single Link", () => {
    const data = singleChoiceParameterLinks
    const expectedResult = readXMLFixtureAsString(import.meta.url, "exportSingle.xml")

    const exported = exportChoiceParameterLinksToXML(mockContext, mockRule, data)
    const xmlString = xmlExport({ ChoiceParameterLinks: exported }, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should export ChoiceParameterLinks with multiple Links", () => {
    const data = multipleChoiceParameterLinks
    const expectedResult = readXMLFixtureAsString(import.meta.url, "exportMultiple.xml")

    const exported = exportChoiceParameterLinksToXML(mockContext, mockRule, data)
    const xmlString = xmlExport({ ChoiceParameterLinks: exported }, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should export ChoiceParameterLinks with DataPath as string", () => {
    const data = withStringDataPathChoiceParameterLinks
    const expectedResult = readXMLFixtureAsString(import.meta.url, "withStringDataPath.xml")

    const exported = exportChoiceParameterLinksToXML(mockContext, mockRule, data)
    const xmlString = xmlExport({ ChoiceParameterLinks: exported }, false)

    expect(xmlString).toEqual(expectedResult)
  })
})
