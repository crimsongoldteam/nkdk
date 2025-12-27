import { describe, expect, it } from "vitest"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportStandardAttributeDescriptionsToXML, exportStandardAttributeDescriptionToXML } from "./exportToXML"
import { StandardAttributeDescription, StandardAttributeDescriptions } from "./types"

describe("exportStandardAttributeDescriptionToXML", () => {
  it("should export with single value", () => {
    const data: StandardAttributeDescription = {
      fillChecking: "ShowError",
      name: "PredefinedDataName",
    }

    const expectedResult = readXMLFileAsString("standartAttribute/singleExport.xml")

    const xmlData = exportStandardAttributeDescriptionToXML(mockСontext, data)

    const result = xmlExport({ "xr:StandardAttribute": xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export with multiple values", () => {
    const data: StandardAttributeDescriptions = [
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

    const expectedResult = readXMLFileAsString("standartAttribute/multipleExport.xml")
    const xmlData = exportStandardAttributeDescriptionsToXML(mockСontext, data)
    const result = xmlExport({ "xr:StandardAttribute": xmlData }, false)
    expect(result).toEqual(expectedResult)
  })
})
