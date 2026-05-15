import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
import {
  availableFieldsWithLwsTitleAndFalseUse,
  availableFieldsWithLwsTitleAndFalseUseYAML,
  fullAvailableFields,
  fullAvailableFieldsYAML,
} from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "AvailableFields",
  yaml: "Поля",
}

describe("export available fields to YAML", () => {
  it("exports full YAML", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: fullAvailableFields,
    })

    expect(result).toEqual({
      Поля: fullAvailableFieldsYAML,
    })
  })

  it("exports false use and lwsTitle", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: availableFieldsWithLwsTitleAndFalseUse,
    })

    expect(result).toEqual({
      Поля: availableFieldsWithLwsTitleAndFalseUseYAML,
    })
  })
})
