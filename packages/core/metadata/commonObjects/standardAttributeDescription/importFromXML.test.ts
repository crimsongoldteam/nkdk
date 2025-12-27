import { readFileSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { mockСontext } from "~/tests/mockContext"
import xmlImport from "~/xml/import/importer"
import { importStandardAttributeDescriptionFromXML, importStandardAttributeDescriptionsFromXML } from "./importFromXML"
import {
  StandardAttributeDescription,
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsXML,
  StandardAttributeDescriptionXML,
} from "./types"

describe("importStandardAttributeDescriptionFromXML", () => {
  it("should import with single value", () => {
    const xml = readFileSync(join(process.cwd(), "lib/tests/fixtures/standartAttribute/single.xml"), "utf-8")

    const expectedResult: StandardAttributeDescription = {
      fillChecking: "ShowError",
      name: "PredefinedDataName",
    }

    const xmlData = xmlImport<{ "xr:StandardAttribute": StandardAttributeDescriptionXML }>(xml)

    const result = importStandardAttributeDescriptionFromXML(mockСontext, xmlData["xr:StandardAttribute"])
    expect(result).toEqual(expectedResult)
  })

  it("should return undefined when all values are defaults", () => {
    const xml = readFileSync(join(process.cwd(), "lib/tests/fixtures/standartAttribute/default.xml"), "utf-8")

    const xmlData = xmlImport<{ "xr:StandardAttribute": StandardAttributeDescriptionXML }>(xml)

    const result = importStandardAttributeDescriptionFromXML(mockСontext, xmlData["xr:StandardAttribute"])
    expect(result).toBeUndefined()
  })

  it("should import with multiple values", () => {
    const xml = readFileSync(join(process.cwd(), "lib/tests/fixtures/standartAttribute/multiple.xml"), "utf-8")

    const expectedResult: StandardAttributeDescriptions = [
      {
        fillChecking: "ShowError",
        name: "PredefinedDataName",
        synonym: { items: { ru: "Какой-то синоним" } },
      },
      {
        name: "Predefined",
        synonym: { items: { ru: "Другой какой-то синоним" } },
      },
    ]

    const xmlData = xmlImport<{ "xr:StandardAttribute": StandardAttributeDescriptionsXML }>(xml)

    const result = importStandardAttributeDescriptionsFromXML(mockСontext, xmlData["xr:StandardAttribute"])
    expect(result).toEqual(expectedResult)
  })

  it("should import with multiple default values to undefined", () => {
    const xml = readFileSync(join(process.cwd(), "lib/tests/fixtures/standartAttribute/multipleDefault.xml"), "utf-8")

    const xmlData = xmlImport<{ "xr:StandardAttribute": StandardAttributeDescriptionsXML }>(xml)

    const result = importStandardAttributeDescriptionsFromXML(mockСontext, xmlData["xr:StandardAttribute"])
    expect(result).toBeUndefined()
  })
})
