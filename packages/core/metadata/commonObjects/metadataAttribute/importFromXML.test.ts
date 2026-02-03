import { describe, expect, it } from "vitest"
import {
  fullMetadataAttributes,
  minimalMetadataAttributes,
  multipleMetadataAttributes,
  withMinValueMetadataAttribute,
} from "~/tests/fixtures/metadataAttribute/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importMetadataAttributesFromXML } from "./importFromXML"
import { MetadataAttributeXML } from "./types"

describe("importMetadataAttributeFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importMetadataAttributesFromXML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const xmlData = readAndParseXMLFile<{ Attribute: MetadataAttributeXML }>("metadataAttribute/full.xml")

    const result = importMetadataAttributesFromXML(mockContext, mockRule, xmlData.Attribute)

    expect(result).toEqual(fullMetadataAttributes)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ Attribute: MetadataAttributeXML }>("metadataAttribute/minimal.xml")

    const result = importMetadataAttributesFromXML(mockContext, mockRule, xmlData.Attribute)

    expect(result).toEqual(minimalMetadataAttributes)
  })

  it("should import defaults", () => {
    const xmlData = readAndParseXMLFile<{ Attribute: MetadataAttributeXML }>("metadataAttribute/defaults.xml")

    const result = importMetadataAttributesFromXML(mockContext, mockRule, xmlData.Attribute)

    expect(result).toEqual(minimalMetadataAttributes)
  })

  it("should import multiple attributes", () => {
    const xmlData = readAndParseXMLFile<{ Attribute: MetadataAttributeXML[] }>("metadataAttribute/multiple.xml")

    const result = importMetadataAttributesFromXML(mockContext, mockRule, xmlData.Attribute)

    expect(result).toEqual(multipleMetadataAttributes)
  })

  it("should import with min value", () => {
    const xmlData = readAndParseXMLFile<{ Attribute: MetadataAttributeXML }>("metadataAttribute/withMinValue.xml")

    const result = importMetadataAttributesFromXML(mockContext, mockRule, xmlData.Attribute)

    expect(result).toEqual(withMinValueMetadataAttribute)
  })
})
