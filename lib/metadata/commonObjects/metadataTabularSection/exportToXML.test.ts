import { readFileSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import xmlImport from "~/lib/xml/import/importer"
import { importMetadataTabularSectionFromXML } from "./importFromXML"
import { MetadataTabularSection, MetadataTabularSectionXML } from "./types"

describe("exportMetadataTabularSectionToXML", () => {
  it("should export tabular section with one attribute", () => {
    const xml = readFileSync(join(process.cwd(), "tests/fixtures/metadataTabularSection/oneAttribute.xml"), "utf-8")

    const expectedResult = {
      name: "Контакты",
      comment: undefined,
      fillChecking: "DontCheck",
      lineNumberLength: undefined,
      objectBelonging: undefined,
      standardAttributes: undefined,
      synonym: { items: { ru: "Контакты" } },
      tooltip: undefined,
      use: undefined,
      attributes: [
        {
          name: "LineNumber",
          synonym: { items: { ru: "Номер строки" } },
          type: { type: ["string"] },
        },
      ],
    } as MetadataTabularSection

    const xmlData = xmlImport<{ TabularSection: MetadataTabularSectionXML }>(xml)

    const result = importMetadataTabularSectionFromXML(xmlData.TabularSection, mockConfigurationSettings)

    expect(result).toEqual(expectedResult)
  })
})
