import { describe, expect, it } from "vitest"
import { readAndParseXMLFixture, readXMLFixtureAsString } from "../../../tests/readFixtureXML"
import { parseStructuralXMLWithoutCompatibility } from "../../../tests/structuralXML"
import { xmlFixtureValue as importContentFromXML } from "../../../tests/xmlFixtureValue"
import { fullStandartBeginningDate } from "./__fixtures__/data"
import { importStandartBeginningDateFromXML } from "./fromXML"
import type { StandartBeginningDateXML } from "./types"

describe("importStandartBeginningDateFromXML", () => {
  it("imports the existing fixture without compatibility XML", () => {
    expect(importStandartBeginningDateFromXML(parseStructuralXMLWithoutCompatibility(readXMLFixtureAsString(import.meta.url, "full.xml")))).toEqual(fullStandartBeginningDate)
  })

  it.each([
    ["<Root/>", undefined],
    ["<Root><v8:variant>Custom</v8:variant></Root>", undefined],
    ['<Root><v8:variant xsi:type="v8:StandardBeginningDateVariant"/></Root>', undefined],
    ['<Root><v8:variant xsi:type="v8:StandardBeginningDateVariant">Custom</v8:variant><v8:date/></Root>', { variant: "Custom" }],
  ])("preserves empty and untyped variants: %s", (xml, expected) => {
    expect(importStandartBeginningDateFromXML(importContentFromXML<{ Root: StandartBeginningDateXML }>(xml).Root)).toEqual(expected)
    expect(importStandartBeginningDateFromXML(parseStructuralXMLWithoutCompatibility(xml))).toEqual(expected)
  })

  it("imports full.xml", () => {
    const parsed = readAndParseXMLFixture<{ "dcsset:right": StandartBeginningDateXML }>(import.meta.url, "full.xml")
    expect(importStandartBeginningDateFromXML(parsed["dcsset:right"])).toEqual(fullStandartBeginningDate)
  })
})
