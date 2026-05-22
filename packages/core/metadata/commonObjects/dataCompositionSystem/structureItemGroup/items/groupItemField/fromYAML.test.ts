import { describe, expect, it } from "vitest"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import {
  dynamicListGroupItemFieldDefault,
  dynamicListGroupItemFieldDefaultYAML,
  dynamicListGroupItemFieldUseFalse,
  dynamicListGroupItemFieldUseFalseLegacyYAML,
} from "./__fixtures__/data"
import "./index"

const rule = { type: "GroupItemField" } as const

describe("import GroupItemField from YAML", () => {
  it("imports '(Наименование)' as use=false", () => {
    const result = testImportPropertyFromYAML({ rule, value: dynamicListGroupItemFieldUseFalseLegacyYAML })
    expect(result).toEqual(dynamicListGroupItemFieldUseFalse)
  })

  it("imports 'Наименование' as use=true (default)", () => {
    const result = testImportPropertyFromYAML({ rule, value: dynamicListGroupItemFieldDefaultYAML })
    expect(result).toEqual(dynamicListGroupItemFieldDefault)
  })

  it("imports object with hierarchy group type", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: {
        Поле: "СсылкаВидЦен",
        ТипГруппировки: "Иерархия",
      },
    })

    expect(result).toEqual({
      itemType: "GroupItemField",
      field: "СсылкаВидЦен",
      groupType: "Hierarchy",
    })
  })
})
