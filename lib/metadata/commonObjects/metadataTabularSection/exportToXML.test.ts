import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { readAndParseXMLFile } from "~/lib/tests/readAndParseXMLFile"
import { xmlExport } from "~/lib/xml/export/exporter"
import { exportMetadataTabularSectionToXML } from "./exportToXML"
import { MetadataTabularSection, MetadataTabularSectionXML } from "./types"

describe("exportMetadataTabularSectionToXML", () => {
  it("should export tabular section with one attribute", () => {
    const data: MetadataTabularSection = {
      name: "Контакты",
      synonym: { items: { ru: "Контакты" } },
      attributes: [
        {
          name: "Наименование",
          synonym: { items: { ru: "Имя Фамилия" } },
          type: {
            type: ["string"],
            stringQualifiers: { allowedLength: "Variable", length: 0 },
          },
          fullTextSearch: "DontUse",
        },
      ],
    }

    const expectedResult = readAndParseXMLFile<{ TabularSection: MetadataTabularSectionXML }>(
      "metadataTabularSection/oneAttribute.xml"
    )

    const result = exportMetadataTabularSectionToXML(data, mockConfigurationSettings)
    const resultXml = xmlExport({ TabularSection: result }, false).trim()

    expect(resultXml).toEqual(expectedResult.TabularSection)
  })
})
