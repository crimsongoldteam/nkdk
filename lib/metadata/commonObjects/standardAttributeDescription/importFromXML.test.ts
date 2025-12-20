import { readFileSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import xmlImport from "~/lib/xml/import/importer"
import { importStandardAttributeDescriptionFromXML } from "./importFromXML"
import { StandardAttributeDescription, StandardAttributeDescriptionXML } from "./types"

describe("importStandardAttributeDescriptionFromXML", () => {
  it("should import standard attribute description from XML", () => {
    const xml = readFileSync(join(process.cwd(), "tests/fixtures/standartAttribute/single.xml"), "utf-8")

    const expectedResult: StandardAttributeDescription = {
      fillChecking: "ShowError",
      name: "PredefinedDataName",
    }

    const xmlData = xmlImport<{ "xr:StandardAttribute": StandardAttributeDescriptionXML }>(xml)

    const result = importStandardAttributeDescriptionFromXML(xmlData["xr:StandardAttribute"], mockConfigurationSettings)
    expect(result).toEqual(expectedResult)
  })

  it("should return undefined when all values are defaults", () => {
    const xml = readFileSync(join(process.cwd(), "tests/fixtures/standartAttribute/default.xml"), "utf-8")

    const xmlData = xmlImport<{ "xr:StandardAttribute": StandardAttributeDescriptionXML }>(xml)

    const result = importStandardAttributeDescriptionFromXML(xmlData["xr:StandardAttribute"], mockConfigurationSettings)
    expect(result).toBeUndefined()
  })
})
