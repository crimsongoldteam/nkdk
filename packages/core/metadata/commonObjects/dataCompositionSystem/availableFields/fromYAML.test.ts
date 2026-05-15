import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import {
  availableFieldsWithLwsTitleAndFalseUse,
  availableFieldsWithLwsTitleAndFalseUseYAML,
  fullAvailableFields,
  fullAvailableFieldsYAML,
} from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "AvailableFields",
}

describe("import available fields from YAML", () => {
  it("imports full YAML", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: fullAvailableFieldsYAML,
    })

    expect(result).toEqual(fullAvailableFields)
  })

  it("imports false use and lwsTitle", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: availableFieldsWithLwsTitleAndFalseUseYAML,
    })

    expect(result).toEqual(availableFieldsWithLwsTitleAndFalseUse)
  })

  it("imports item with only field as string", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: [{ Поле: "Документ" }],
    })

    expect(result).toEqual(["Документ"])
  })
})
