import { readFileSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { xmlImport } from "~/lib"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { multipleAttributes } from "~/tests/fixtures/metadataAttribute/multiple"
import { singleAttribute } from "~/tests/fixtures/metadataAttribute/single"
import { importMetadataAttributesFromXML } from "./importFromXML"
import { MetadataAttributeXML } from "./types"

describe("importMetadataAttributeFromXML", () => {
  it("should import single attribute from XML", () => {
    const xml = readFileSync(join(process.cwd(), "tests/fixtures/metadataAttribute/single.xml"), "utf-8")
    const expectedResult = singleAttribute

    const xmlData = xmlImport<{ Attribute: MetadataAttributeXML }>(xml)

    const result = importMetadataAttributesFromXML(xmlData.Attribute, mockConfigurationSettings)

    expect(result).toEqual(expectedResult)
  })

  it("should import multiple attributes from XML", () => {
    const xml = readFileSync(join(process.cwd(), "tests/fixtures/metadataAttribute/multiple.xml"), "utf-8")
    const expectedResult = multipleAttributes

    const xmlData = xmlImport<{ Attribute: MetadataAttributeXML[] }>(xml)

    const result = importMetadataAttributesFromXML(xmlData.Attribute, mockConfigurationSettings)

    expect(result).toEqual(expectedResult)
  })
})
