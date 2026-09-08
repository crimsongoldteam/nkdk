import { describe, expect, it } from "vitest"
import { multiple, single } from "./__fixtures__/data"
import { mockContextFromXML, mockRule } from "../../../tests/mockContext"
import { readAndParseXMLFile } from "../../../tests/readAndParseXMLFile"
import { xmlFixtureValue as importContentFromXML } from "../../../tests/xmlFixtureValue"
import { importMetadataObjectRefCollectionFromXML } from "./fromXML"
import { MetadataObjectRefCollectionXML } from "./types"
import { parseStructuralXMLWithoutCompatibility } from "../../../tests/structuralXML"

describe("importMetadataObjectRefCollectionFromXML", () => {
  it.each([
    ["<BasedOn/>", undefined],
    ['<BasedOn><xr:Item xsi:type="xr:MDObjectRef">Catalog.Контрагенты</xr:Item></BasedOn>', single],
    ['<BasedOn><xr:Item xsi:type="xr:MDObjectRef">Catalog.Контрагенты</xr:Item><xr:Item xsi:type="xr:MDObjectRef">Document.ПриемНаРаботу</xr:Item></BasedOn>', multiple],
  ])("reads structural object references: %s", (xml, expected) => {
    expect(importMetadataObjectRefCollectionFromXML(mockContextFromXML(), mockRule, parseStructuralXMLWithoutCompatibility(xml))).toEqual(expected)
  })

  it("should return undefined when data is undefined", () => {
    const result = importMetadataObjectRefCollectionFromXML(mockContextFromXML(), mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should import with single value", () => {
    const xml = readAndParseXMLFile<{ BasedOn: MetadataObjectRefCollectionXML }>(
      "metadataObjectRefCollection/single.xml"
    )

    const result = importMetadataObjectRefCollectionFromXML(mockContextFromXML(), mockRule, xml.BasedOn)
    expect(result).toEqual(single)
  })

  it("should import with multiple values", () => {
    const xml = readAndParseXMLFile<{ BasedOn: MetadataObjectRefCollectionXML }>(
      "metadataObjectRefCollection/multiple.xml"
    )

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
