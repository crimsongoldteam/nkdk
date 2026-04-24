import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import { group, groupYAML } from "./__fixtures__/group"
import { item, itemYAML } from "./__fixtures__/item"
import "./types"

const importRule: PropertyRule = { type: "PredefinedItemCollection" }
const exportRule: PropertyRule = { type: "PredefinedItemCollection", yaml: "Элементы" }

const cases = [
  { name: "group", model: [group], yaml: groupYAML },
  { name: "item", model: [item], yaml: itemYAML },
] as const

describe("import PredefinedItemCollection from YAML", () => {
  it("imports undefined", () => {
    const result = testImportPropertyFromYAML({ rule: importRule, value: undefined })
    expect(result).toBeUndefined()
  })

  it.each(cases)("imports $name fixture", ({ model, yaml }) => {
    const result = testImportPropertyFromYAML({ rule: importRule, value: yaml })
    expect(result).toEqual(model)
  })

  it.each(cases)("round-trip $name: import → export совпадает с исходным YAML", ({ yaml }) => {
    const imported = testImportPropertyFromYAML({ rule: importRule, value: yaml })
    const exported = testExportPropertyToYAML({ rule: exportRule, value: imported })
    expect(exported).toEqual({ Элементы: yaml })
  })
})
