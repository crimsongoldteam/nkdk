import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
import { testExportPropertyToYAML } from "../../../../tests/property/exportPropertyToYAML"
import {
  fullAvailableFields,
  fullAvailableFieldsYAML,
  selectedItemAvailableFields,
  selectedItemAvailableFieldsYAML,
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

  it("exports selected items", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: selectedItemAvailableFields,
    })

    expect(result).toEqual({
      Поля: selectedItemAvailableFieldsYAML,
    })
  })

  it("exports item with only field as string", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: [{ field: "Документ" }],
    })

    expect(result).toEqual({
      Поля: ["Документ"],
    })
  })
})
