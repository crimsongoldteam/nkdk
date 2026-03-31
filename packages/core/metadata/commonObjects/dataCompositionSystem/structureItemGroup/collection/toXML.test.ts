import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { fixtureGroupItemAuto } from "../items/groupItemAuto/__fixtures__/data"
import { dynamicListGroupItemFieldUseFalse } from "../items/groupItemField/__fixtures__/data"
import "./index"

const rule = { type: "StructureItemGroupCollectionItem" } as const
const fixturesDir = dirname(fileURLToPath(import.meta.url))
const autoFixturesDir = join(fixturesDir, "../items/groupItemAuto/__fixtures__")
const fieldFixturesDir = join(fixturesDir, "../items/groupItemField/__fixtures__")

describe("export GroupItem collection to XML", () => {
  it("exports GroupItemAuto", () => {
    const expectedResult = readXMLFileAsString("dynamicList.xml", autoFixturesDir)

    const { result } = testExportPropertyToXML({
      rule,
      value: [fixtureGroupItemAuto],
      xmlRootTag: "dcsset:item",
      referenceMetadata: undefined,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports GroupItemField", () => {
    const expectedResult = readXMLFileAsString("dynamicList.xml", fieldFixturesDir)

    const { result } = testExportPropertyToXML({
      rule,
      value: [dynamicListGroupItemFieldUseFalse],
      xmlRootTag: "dcsset:item",
      referenceMetadata: undefined,
    })

    expect(result).toEqual(expectedResult)
  })
})
