import { describe, expect, it } from "vitest"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
import {
  dynamicListGroupItemFieldDefault,
  dynamicListGroupItemFieldUseFalse,
  dynamicListGroupItemsDefaultYAML,
  dynamicListGroupItemsUseFalseYAML,
} from "./__fixtures__/data"
import "./types"

const rule = { type: "StructureItemGroupCollectionItem", yaml: "ПоляГруппировки" } as const

describe("export GroupItemField to YAML", () => {
  it("exports use=false as '(Наименование)'", () => {
    const result = testExportPropertyToYAML({ rule, value: [dynamicListGroupItemFieldUseFalse] })
    expect(result).toEqual({ ПоляГруппировки: dynamicListGroupItemsUseFalseYAML })
  })

  it("exports use=true as 'Наименование'", () => {
    const result = testExportPropertyToYAML({ rule, value: [dynamicListGroupItemFieldDefault] })
    expect(result).toEqual({ ПоляГруппировки: dynamicListGroupItemsDefaultYAML })
  })
})
