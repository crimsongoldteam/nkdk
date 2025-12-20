import { readFileSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { xmlExport } from "~/lib/xml/export/exporter"
import { exportMetadataTabularSectionToXML } from "./exportToXML"
import { MetadataTabularSection } from "./types"

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

    const expectedResult = readFileSync(
      join(process.cwd(), "tests/fixtures/metadataTabularSection/oneAttribute.xml"),
      "utf-8"
    )

    const result = exportMetadataTabularSectionToXML(data, mockConfigurationSettings)
    const resultXml = xmlExport({ TabularSection: result }, false).trim()

    expect(resultXml).toEqual(expectedResult)
  })
})
