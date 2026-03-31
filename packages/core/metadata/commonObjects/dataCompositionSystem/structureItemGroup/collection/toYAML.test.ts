import { describe, expect, it } from "vitest"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
import { fixtureGroupItemAuto, fixtureGroupItemAutoYAML } from "../items/groupItemAuto/__fixtures__/data"
import {
  dynamicListGroupItemFieldUseFalse,
  dynamicListGroupItemFieldUseFalseYAML,
} from "../items/groupItemField/__fixtures__/data"
import "./index"

const rule = { type: "StructureItemGroupCollectionItem", yaml: "ПоляГруппировки" } as const

describe("export GroupItem collection to YAML", () => {
  it("exports GroupItemAuto", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: [fixtureGroupItemAuto],
    })

    expect(result).toEqual({
      ПоляГруппировки: [fixtureGroupItemAutoYAML],
    })
  })

  it("exports GroupItemField", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: [dynamicListGroupItemFieldUseFalse],
    })

    expect(result).toEqual({
      ПоляГруппировки: [dynamicListGroupItemFieldUseFalseYAML],
    })
  })
})
