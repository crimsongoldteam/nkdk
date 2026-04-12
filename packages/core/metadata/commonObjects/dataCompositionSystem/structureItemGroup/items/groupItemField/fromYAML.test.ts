import { describe, expect, it } from "vitest"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import {
  dynamicListGroupItemFieldDefault,
  dynamicListGroupItemFieldDefaultYAML,
  dynamicListGroupItemFieldUseFalse,
  dynamicListGroupItemFieldUseFalseYAML,
} from "./__fixtures__/data"
import "./index"

const rule = { type: "GroupItemField" } as const

describe("import GroupItemField from YAML", () => {
  it("imports '(Наименование)' as use=false", () => {
    const result = testImportPropertyFromYAML({ rule, value: dynamicListGroupItemFieldUseFalseYAML })
    expect(result).toEqual(dynamicListGroupItemFieldUseFalse)
  })

  it("imports 'Наименование' as use=true (default)", () => {
    const result = testImportPropertyFromYAML({ rule, value: dynamicListGroupItemFieldDefaultYAML })
    expect(result).toEqual(dynamicListGroupItemFieldDefault)
  })
})
