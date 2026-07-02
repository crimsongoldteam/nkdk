import { describe, expect, it } from "vitest"
import { testImportPropertyFromYAML } from "../../../../../tests/property/importPropertyFromYAML"
import { fixtureGroupItemAuto, fixtureGroupItemAutoYAML } from "../items/groupItemAuto/__fixtures__/data"
import {
  dynamicListGroupItemFieldDefault,
  dynamicListGroupItemFieldDefaultYAML,
  dynamicListGroupItemFieldUseFalse,
  dynamicListGroupItemFieldUseFalseYAML,
} from "../items/groupItemField/__fixtures__/data"
import "./index"

const rule = { type: "StructureItemGroupCollection" } as const

describe("import GroupItem collection from YAML", () => {
  it("imports GroupItemAuto by detectYAML", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: [fixtureGroupItemAutoYAML],
    })

    expect(result).toEqual([fixtureGroupItemAuto])
  })

  it("imports GroupItemField by detectYAML", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: [dynamicListGroupItemFieldDefaultYAML],
    })

    expect(result).toEqual([dynamicListGroupItemFieldDefault])
  })

  it("imports object GroupItemField by detectYAML", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: [dynamicListGroupItemFieldUseFalseYAML],
    })

    expect(result).toEqual([dynamicListGroupItemFieldUseFalse])
  })
})
