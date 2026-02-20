import { describe, expect, it } from "vitest"
import { fullTabularSections, minimalTabularSections } from "~/tests/fixtures/metadataTabularSection/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importMetadataTabularSectionsFromXML } from "./fromXML"
import { MetadataTabularSectionXML } from "./types"

describe("importMetadataTabularSectionFromXML", () => {
  it("should import all possible properties", () => {
    const xmlData = readAndParseXMLFile<{ TabularSection: MetadataTabularSectionXML }>(
      "metadataTabularSection/full.xml"
    )

    const result = importMetadataTabularSectionsFromXML(mockContext, mockRule, xmlData.TabularSection)
    expect(result).toEqual(fullTabularSections)
  })

  it("should import minimal properties", () => {
    const xmlData = readAndParseXMLFile<{ TabularSection: MetadataTabularSectionXML }>(
      "metadataTabularSection/minimal.xml"
    )

    const result = importMetadataTabularSectionsFromXML(mockContext, mockRule, xmlData.TabularSection)
    expect(result).toEqual(minimalTabularSections)
  })

  it("should import defaults", () => {
    const xmlData = readAndParseXMLFile<{ TabularSection: MetadataTabularSectionXML }>(
      "metadataTabularSection/defaults.xml"
    )

    const result = importMetadataTabularSectionsFromXML(mockContext, mockRule, xmlData.TabularSection)
    expect(result).toEqual(minimalTabularSections)
  })
})
