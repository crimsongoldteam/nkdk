import { describe, expect, it } from "vitest"
import { multipleCharacteristics } from "~/tests/fixtures/characteristicsDescription/multiple"
import { singleCharacteristic } from "~/tests/fixtures/characteristicsDescription/single"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importCharacteristicsDescriptionsFromXML } from "./importFromXML"
import { CharacteristicsDescriptionsXML } from "./types"

describe("importCharacteristicsDescriptionFromXML", () => {
  it("should import single characteristic", () => {
    const xmlData = readAndParseXMLFile<{ Characteristics: CharacteristicsDescriptionsXML }>(
      "characteristicsDescription/simple.xml"
    )

    const expectedResult = singleCharacteristic
    const result = importCharacteristicsDescriptionsFromXML(mockContext, mockRule, xmlData.Characteristics)
    expect(result).toEqual(expectedResult)
  })

  it("should import multiple characteristics", () => {
    const xmlData = readAndParseXMLFile<{ Characteristics: CharacteristicsDescriptionsXML }>(
      "characteristicsDescription/multiple.xml"
    )

    const expectedResult = multipleCharacteristics
    const result = importCharacteristicsDescriptionsFromXML(mockContext, mockRule, xmlData.Characteristics)
    expect(result).toEqual(expectedResult)
  })
})
