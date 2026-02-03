import { describe, expect, it, vi } from "vitest"
import { fullTabularSections, minimalTabularSections } from "~/tests/fixtures/metadataTabularSection/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportMetadataTabularSectionsToXML } from "./exportToXML"

vi.mock("uuid", () => ({
  v4: vi.fn(() => "11111111-1111-4111-8111-111111111111"),
}))

const mockContextWithParent = {
  ...mockContext,
  context: {
    parentName: "Контрагенты",
  },
}

describe("exportMetadataTabularSectionsToXML", () => {
  it("should export all possible properties", () => {
    const expectedXml = readXMLFileAsString("metadataTabularSection/full.xml")

    const result = exportMetadataTabularSectionsToXML(mockContextWithParent, mockRule, fullTabularSections)
    const xmlString = xmlExport({ TabularSection: result }, false)

    expect(xmlString).toEqual(expectedXml)
  })

  it("should export defaults", () => {
    const expectedXml = readXMLFileAsString("metadataTabularSection/defaults.xml")

    const result = exportMetadataTabularSectionsToXML(mockContextWithParent, mockRule, minimalTabularSections)
    const xmlString = xmlExport({ TabularSection: result }, false)

    expect(xmlString).toEqual(expectedXml)
  })
})
