import { readFileSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import xmlImport from "~/lib/xml/import/importer"
import { importMetadataTabularSectionFromXML } from "./importFromXML"
import { MetadataTabularSectionXML } from "./types"

describe("importMetadataTabularSectionFromXML", () => {
  it("should import metadata tabular section from XML", () => {
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
    }
    const xmlData = xmlImport<{ TabularSection: MetadataTabularSectionXML }>(xml)
    const result = importMetadataTabularSectionFromXML(xmlData.TabularSection, mockConfigurationSettings)
    expect(result).toEqual(expectedResult)
  })
})
