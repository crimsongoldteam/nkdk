import { describe, expect, it } from "vitest"
import { testImportPropertyFromYAML } from "../../../../tests/property/importPropertyFromYAML"
import {
  appearanceCalculatedField,
  appearanceCalculatedFieldYAML,
  availableValuesCalculatedField,
  availableValuesCalculatedFieldYAML,
  fullCalculatedFieldFromCompactYAML,
  fullCalculatedFieldYAML,
} from "./__fixtures__/data"
import "./types"

describe("import CalculatedField from YAML", () => {
  it("imports full YAML", () => {
    const result = testImportPropertyFromYAML({
      rule: { type: "CalculatedField" },
      value: fullCalculatedFieldYAML,
    })

    expect(result).toEqual(fullCalculatedFieldFromCompactYAML)
  })

  it("imports appearance YAML", () => {
    const result = testImportPropertyFromYAML({
      rule: { type: "CalculatedField" },
      value: appearanceCalculatedFieldYAML,
    })

    expect(result).toEqual(appearanceCalculatedField)
  })

  it("imports available values", () => {
    const result = testImportPropertyFromYAML({
      rule: { type: "CalculatedField" },
      value: availableValuesCalculatedFieldYAML,
    })

    expect(result).toEqual(availableValuesCalculatedField)
  })
})
