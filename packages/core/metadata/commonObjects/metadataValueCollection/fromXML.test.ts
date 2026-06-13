import { describe, expect, it } from "vitest"
import { multiple, single } from "~/metadata/commonObjects/metadataValueCollection/__fixtures__/data"
import { mockContextFromXML, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importContentFromXML } from "~/xml/import/importer"
import { importMetadataValueCollectionFromXML } from "./fromXML"
import { MetadataValueCollectionXML } from "./types"

describe("importMetadataValueCollectionFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importMetadataValueCollectionFromXML(mockContextFromXML(), mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should import with single value", () => {
    const xml = readAndParseXMLFile<{ BasedOn: MetadataValueCollectionXML }>("metadataValueCollection/single.xml")

    const result = importMetadataValueCollectionFromXML(mockContextFromXML(), mockRule, xml.BasedOn)
    expect(result).toEqual(single)
  })

  it("should import with multiple values", () => {
    const xml = readAndParseXMLFile<{ BasedOn: MetadataValueCollectionXML }>("metadataValueCollection/multiple.xml")

    const result = importMetadataValueCollectionFromXML(mockContextFromXML(), mockRule, xml.BasedOn)
    expect(result).toEqual(multiple)
  })

  it("rejects aggregate metadata values", () => {
    const xml = importContentFromXML<{ BasedOn: MetadataValueCollectionXML }>(
      '<BasedOn><xr:Item xsi:type="xr:ValueList"/></BasedOn>'
    )

    expect(() => importMetadataValueCollectionFromXML(mockContextFromXML(), mockRule, xml.BasedOn)).toThrow(
      "MetadataValueCollection: ожидался примитив, получен valueList"
    )
  })
})
