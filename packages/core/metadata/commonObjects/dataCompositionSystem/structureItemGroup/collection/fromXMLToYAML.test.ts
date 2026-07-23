import { describe, expect, it } from "vitest"

import { testPropertyFixtureThroughYAML } from "../../../../../tests/directConversion"
import { fixtureGroupItemAutoYAML } from "../items/groupItemAuto/__fixtures__/data"
import { dynamicListGroupItemFieldUseFalseYAML } from "../items/groupItemField/__fixtures__/data"

import "./index"

describe("StructureItemGroupCollection XML → YAML", () => {
  it("imports GroupItemAuto", () => {
    const result = convert("../../items/groupItemAuto/__fixtures__/dynamicList.xml")

    expect(result.yaml).toEqual({ Значение: [fixtureGroupItemAutoYAML] })
  })

  it("imports GroupItemField", () => {
    const result = convert("../../items/groupItemField/__fixtures__/dynamicList.xml")

    expect(result.yaml).toEqual({ Значение: [dynamicListGroupItemFieldUseFalseYAML] })
  })
})

const convert = (fixture: string) =>
  testPropertyFixtureThroughYAML({
    propertyType: "StructureItemGroupCollection",
    xmlRootTag: "dcsset:item",
    importMetaUrl: import.meta.url,
    fixture,
  })
