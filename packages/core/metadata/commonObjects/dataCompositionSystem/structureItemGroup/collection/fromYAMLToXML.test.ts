import { describe, expect, it } from "vitest"

import { testPropertyFixtureThroughYAML } from "../../../../../tests/directConversion"
import { fixtureGroupItemAutoYAML } from "../items/groupItemAuto/__fixtures__/data"
import {
  dynamicListGroupItemFieldDefaultYAML,
  dynamicListGroupItemFieldUseFalseYAML,
} from "../items/groupItemField/__fixtures__/data"

import "./index"

describe("StructureItemGroupCollection YAML → XML", () => {
  it("imports GroupItemAuto by detectYAML and exports GroupItemAuto", () => {
    const result = convert("../../items/groupItemAuto/__fixtures__/dynamicList.xml", fixtureGroupItemAutoYAML)

    expect(normalize(result.result)).toBe(normalize(result.expected))
  })

  it("imports GroupItemField by detectYAML", () => {
    const result = convert(
      "../../items/groupItemField/__fixtures__/dynamicListDefault.xml",
      dynamicListGroupItemFieldDefaultYAML
    )

    expect(normalize(result.result)).toBe(normalize(result.expected))
  })

  it("imports object GroupItemField by detectYAML and exports GroupItemField", () => {
    const result = convert(
      "../../items/groupItemField/__fixtures__/dynamicList.xml",
      dynamicListGroupItemFieldUseFalseYAML
    )

    expect(normalize(result.result)).toBe(normalize(result.expected))
  })
})

const convert = (fixture: string, yaml: unknown) =>
  testPropertyFixtureThroughYAML({
    propertyType: "StructureItemGroupCollection",
    xmlRootTag: "dcsset:item",
    importMetaUrl: import.meta.url,
    fixture,
    yaml: { Значение: [yaml] },
  })

const normalize = (value: string): string =>
  value
    .replace(/^\ufeff?<\?xml[^\n]*\?>\r?\n?/, "")
    .replace(/\r\n/g, "\n")
    .trim()
