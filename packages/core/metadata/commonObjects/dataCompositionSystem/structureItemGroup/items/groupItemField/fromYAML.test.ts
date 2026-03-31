import { describe, expect, it } from "vitest"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import {
  dynamicListGroupItemFieldDefault,
  dynamicListGroupItemFieldUseFalse,
  dynamicListGroupItemsDefaultYAML,
  dynamicListGroupItemsUseFalseYAML,
} from "./__fixtures__/data"
import "./types"

const rule = { type: "StructureItemGroupCollectionItem" } as const

describe("import GroupItemField from YAML", () => {
  it("imports '(Наименование)' as use=false", () => {
    const result = testImportPropertyFromYAML({ rule, value: dynamicListGroupItemsUseFalseYAML })
    expect(result).toEqual([dynamicListGroupItemFieldUseFalse])
  })

  it("imports 'Наименование' as use=true (default)", () => {
    const result = testImportPropertyFromYAML({ rule, value: dynamicListGroupItemsDefaultYAML })
    expect(result).toEqual([dynamicListGroupItemFieldDefault])
  })
})
