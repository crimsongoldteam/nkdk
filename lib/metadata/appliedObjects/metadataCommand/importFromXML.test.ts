import { assertEquals } from "typia"
import { describe, expect, it } from "vitest"
import { simpleCommand } from "~/lib/tests/fixtures/metadataCommand/simple"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { readAndParseXMLFile } from "~/lib/tests/readAndParseXMLFile"
import { importMetadataCommandFromXML } from "./importFromXML"
import { MetadataCommandXML } from "./types"

describe("importMetadataCommandFromXML", () => {
  it("should import metadata command from XML", () => {
    const xmlData = readAndParseXMLFile<{ Command: MetadataCommandXML }>("metadataCommand/simple.xml")

    const expectedResult = simpleCommand

    expect(assertEquals<MetadataCommandXML>(xmlData.Command)).toEqual(xmlData.Command)

    const result = importMetadataCommandFromXML(xmlData.Command, mockConfigurationSettings)

    expect(result).toEqual(expectedResult)
  })
})
