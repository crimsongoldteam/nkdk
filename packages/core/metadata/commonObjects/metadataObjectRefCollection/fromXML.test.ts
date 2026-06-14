import { describe, expect, it } from "vitest"
import { multiple, single } from "~/metadata/commonObjects/metadataObjectRefCollection/__fixtures__/data"
import { mockContextFromXML, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importContentFromXML } from "~/xml/import/importer"
import { importMetadataObjectRefCollectionFromXML } from "./fromXML"
import { MetadataObjectRefCollectionXML } from "./types"

describe("importMetadataObjectRefCollectionFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importMetadataObjectRefCollectionFromXML(mockContextFromXML(), mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should import with single value", () => {
    const xml = readAndParseXMLFile<{ BasedOn: MetadataObjectRefCollectionXML }>("metadataObjectRefCollection/single.xml")

    const result = importMetadataObjectRefCollectionFromXML(mockContextFromXML(), mockRule, xml.BasedOn)
    expect(result).toEqual(single)
  })

  it("should import with multiple values", () => {
    const xml = readAndParseXMLFile<{ BasedOn: MetadataObjectRefCollectionXML }>("metadataObjectRefCollection/multiple.xml")

    const result = importMetadataObjectRefCollectionFromXML(mockContextFromXML(), mockRule, xml.BasedOn)
    expect(result).toEqual(multiple)
  })

  it("rejects aggregate metadata values", () => {
    const xml = importContentFromXML<{ BasedOn: MetadataObjectRefCollectionXML }>(
      '<BasedOn><xr:Item xsi:type="xr:ValueList"/></BasedOn>'
    )

    expect(() => importMetadataObjectRefCollectionFromXML(mockContextFromXML(), mockRule, xml.BasedOn)).toThrow(
      "MetadataObjectRefCollection: ожидался примитив, получен valueList"
    )
  })
})
