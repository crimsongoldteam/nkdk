import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"
import { testImportPropertyFromXML } from "../../../../../tests/property/importPropertyFromXML"
import { readXMLFileAsString } from "../../../../../tests/readAndParseXMLFile"
import { fixtureGroupItemAuto } from "../items/groupItemAuto/__fixtures__/data"
import { dynamicListGroupItemFieldUseFalse } from "../items/groupItemField/__fixtures__/data"
import "./index"

const rule = { type: "StructureItemGroupCollection" } as const
const fixturesDir = dirname(fileURLToPath(import.meta.url))
const autoFixturesDir = join(fixturesDir, "../items/groupItemAuto/__fixtures__")
const fieldFixturesDir = join(fixturesDir, "../items/groupItemField/__fixtures__")

describe("import GroupItem collection from XML", () => {
  it("imports GroupItemAuto", () => {
    const xmlString = readXMLFileAsString("dynamicList.xml", autoFixturesDir)

    const result = testImportPropertyFromXML({
      rule,
      xmlRootTag: "dcsset:item",
      xmlString,
    })

    expect(result).toEqual([fixtureGroupItemAuto])
  })

  it("imports GroupItemField", () => {
    const xmlString = readXMLFileAsString("dynamicList.xml", fieldFixturesDir)

    const result = testImportPropertyFromXML({
      rule,
      xmlRootTag: "dcsset:item",
      xmlString,
    })

    expect(result).toEqual([dynamicListGroupItemFieldUseFalse])
  })
})
