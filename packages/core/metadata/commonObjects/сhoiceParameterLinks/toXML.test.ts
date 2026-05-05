import { describe, expect, it } from "vitest"
import { multipleChoiceParameterLinks } from "~/tests/fixtures/сhoiceParameterLinks/multiple"
import { singleChoiceParameterLinks } from "~/tests/fixtures/сhoiceParameterLinks/single"
import { withStringDataPathChoiceParameterLinks } from "~/tests/fixtures/сhoiceParameterLinks/withStringDataPath"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
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
    const expectedResult = readXMLFileAsString("сhoiceParameterLinks/exportSingle.xml")

    const exported = exportChoiceParameterLinksToXML(mockContext, mockRule, data)
    const xmlString = xmlExport({ ChoiceParameterLinks: exported }, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should export ChoiceParameterLinks with multiple Links", () => {
    const data = multipleChoiceParameterLinks
    const expectedResult = readXMLFileAsString("сhoiceParameterLinks/exportMultiple.xml")

    const exported = exportChoiceParameterLinksToXML(mockContext, mockRule, data)
    const xmlString = xmlExport({ ChoiceParameterLinks: exported }, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should export ChoiceParameterLinks with DataPath as string", () => {
    const data = withStringDataPathChoiceParameterLinks
    const expectedResult = readXMLFileAsString("сhoiceParameterLinks/withStringDataPath.xml")

    const exported = exportChoiceParameterLinksToXML(mockContext, mockRule, data)
    const xmlString = xmlExport({ ChoiceParameterLinks: exported }, false)

    expect(xmlString).toEqual(expectedResult)
  })
})
