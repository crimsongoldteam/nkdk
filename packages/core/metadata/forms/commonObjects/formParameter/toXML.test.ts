import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { fullFormParameters, withoutTypeFormParameters } from "./__fixtures__/data"
import { exportFormParametersToXML } from "./toXML"

const fixturesDir = resolve(dirname(fileURLToPath(import.meta.url)), "__fixtures__")

describe("exportFormParametersToXML", () => {
  it("should return undefined for undefined input", () => {
    const result = exportFormParametersToXML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should export form parameters correctly", () => {
    const expectedResult = readXMLFileAsString("full.xml", fixturesDir)
    const xmlData = exportFormParametersToXML(mockContext, mockRule, fullFormParameters)
    const result = xmlExport(xmlData!, false)
    expect(result).toEqual(expectedResult.trim())
  })

  it("should export form parameter without type", () => {
    const expectedResult = readXMLFileAsString("withoutType.xml", fixturesDir)
    const xmlData = exportFormParametersToXML(mockContext, mockRule, withoutTypeFormParameters)
    const result = xmlExport(xmlData!, false)
    expect(result).toEqual(expectedResult.trim())
  })
})
