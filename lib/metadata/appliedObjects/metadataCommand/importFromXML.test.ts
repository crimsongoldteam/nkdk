import { readFileSync } from "fs"
import { join } from "path"
import { assertEquals } from "typia"
import { describe, expect, it } from "vitest"
import { simpleCommand } from "~/lib/tests/fixtures/metadataCommand/simple"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import xmlImport from "~/lib/xml/import/importer"
import { importMetadataCommandFromXML } from "./importFromXML"
import { MetadataCommandXML } from "./types"

describe("importMetadataCommandFromXML", () => {
  it("should import metadata command from XML", () => {
    const xml = readFileSync(join(process.cwd(), "tests/fixtures/metadataCommand/simple.xml"), "utf-8")

    const expectedResult = simpleCommand

    const xmlData = xmlImport<{ Command: MetadataCommandXML }>(xml)

    expect(assertEquals<MetadataCommandXML>(xmlData.Command)).toEqual(xmlData.Command)

    const result = importMetadataCommandFromXML(xmlData.Command, mockConfigurationSettings)

    expect(result).toEqual(expectedResult)
  })
})
