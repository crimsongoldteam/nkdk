import { describe, expect, it } from "vitest"
import { readAndParseXMLFixture } from "../../../tests/readFixtureXML"
import { fullStandartBeginningDate } from "./__fixtures__/data"
import { importStandartBeginningDateFromXML } from "./fromXML"
import type { StandartBeginningDateXML } from "./types"

describe("importStandartBeginningDateFromXML", () => {
  it("imports full.xml", () => {
    const parsed = readAndParseXMLFixture<{ "dcsset:right": StandartBeginningDateXML }>(import.meta.url, "full.xml")
    expect(importStandartBeginningDateFromXML(parsed["dcsset:right"])).toEqual(fullStandartBeginningDate)
  })
})
