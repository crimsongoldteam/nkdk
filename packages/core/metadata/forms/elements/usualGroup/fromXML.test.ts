import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory/metadataType/types"
import { ElementXML } from "~/metadata/orchestration"
import { importElementFromXML } from "~/metadata/orchestration/formElement/fromXML"
import { fullUsualGroup, minimalUsualGroup } from "~/tests/fixtures/forms/usualGroup/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importUsualGroupFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContext,
      itemType: CollectionFormElementType.UsualGroup,
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ UsualGroup: ElementXML }>("forms/usualGroup/full.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: CollectionFormElementType.UsualGroup,
      xml: xmlData.UsualGroup,
    })

    expect(result).toEqual(fullUsualGroup)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ UsualGroup: ElementXML }>("forms/usualGroup/minimal.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: CollectionFormElementType.UsualGroup,
      xml: xmlData.UsualGroup,
    })

    expect(result).toEqual(minimalUsualGroup)
  })
})
