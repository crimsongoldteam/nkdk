import { describe, expect, it } from "vitest"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import { calculatedFields, calculatedFieldsYAML } from "./__fixtures__/data"

describe("import CalculatedFields from YAML", () => {
  it("imports YAML array", () => {
    const result = testImportPropertyFromYAML({
      rule: { type: "CalculatedFields" },
      value: calculatedFieldsYAML,
    })

    expect(result).toEqual(calculatedFields)
  })
})
