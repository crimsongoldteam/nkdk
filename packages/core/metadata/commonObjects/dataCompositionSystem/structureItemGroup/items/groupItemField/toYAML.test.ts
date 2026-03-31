import { describe, expect, it } from "vitest"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
import {
  dynamicListGroupItemFieldDefault,
  dynamicListGroupItemFieldDefaultYAML,
  dynamicListGroupItemFieldUseFalse,
  dynamicListGroupItemFieldUseFalseYAML,
} from "./__fixtures__/data"
import "./index"

const rule = { type: "GroupItemField", yaml: "ПоляГруппировки" } as const

describe("export GroupItemField to YAML", () => {
  it("exports use=false as '(Наименование)'", () => {
    const result = testExportPropertyToYAML({ rule, value: dynamicListGroupItemFieldUseFalse })
    expect(result).toEqual({ ПоляГруппировки: dynamicListGroupItemFieldUseFalseYAML })
  })

  it("exports use=true as 'Наименование'", () => {
    const result = testExportPropertyToYAML({ rule, value: dynamicListGroupItemFieldDefault })
    expect(result).toEqual({ ПоляГруппировки: dynamicListGroupItemFieldDefaultYAML })
  })
})
