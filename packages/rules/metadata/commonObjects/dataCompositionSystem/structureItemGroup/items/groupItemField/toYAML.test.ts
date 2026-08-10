import { describe, expect, it } from "vitest"
import { testExportPropertyToYAML } from "../../../../../../tests/property/exportPropertyToYAML"
import { dynamicListGroupItemFieldDefault, dynamicListGroupItemFieldDefaultYAML } from "./__fixtures__/data"
import "./index"

const rule = { type: "GroupItemField", yaml: "ПоляГруппировки" } as const

describe("export GroupItemField to YAML", () => {
  it("exports use=true as 'Наименование'", () => {
    const result = testExportPropertyToYAML({ rule, value: dynamicListGroupItemFieldDefault })
    expect(result).toEqual({ ПоляГруппировки: dynamicListGroupItemFieldDefaultYAML })
  })

  it("exports hierarchy group type as object", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: {
        itemType: "GroupItemField",
        field: "СсылкаВидЦен",
        groupType: "Hierarchy",
      },
    })

    expect(result).toEqual({
      ПоляГруппировки: {
        Поле: "СсылкаВидЦен",
        ТипГруппировки: "Иерархия",
      },
    })
  })

  it("exports disabled group field as object", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: {
        itemType: "GroupItemField",
        field: "СсылкаВидЦен",
        use: false,
      },
    })

    expect(result).toEqual({
      ПоляГруппировки: {
        Поле: "СсылкаВидЦен",
        Использование: "Ложь",
      },
    })
  })
})
