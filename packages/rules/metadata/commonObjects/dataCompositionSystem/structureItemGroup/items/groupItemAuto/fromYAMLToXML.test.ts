import { describe, expect, it } from "vitest"

import { testPropertyFixtureThroughYAML } from "../../../../../../tests/directConversion"
import { fixtureGroupItemAutoUseFalseYAML, fixtureGroupItemAutoYAML } from "./__fixtures__/data"

import "../../collection/types"
import "./index"

describe("GroupItemAuto YAML → XML", () => {
  it("exports full.xml", () => {
    const result = convert("dynamicList.xml", fixtureGroupItemAutoYAML)

    expect(normalize(result.result)).toBe(normalize(result.expected))
  })

  it("exports fullUseFalse.xml", () => {
    const result = convert("dynamicListUseFalse.xml", fixtureGroupItemAutoUseFalseYAML)

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
