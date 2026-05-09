import { describe, expect, it } from "vitest"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
import { calculatedFields, calculatedFieldsYAML } from "./__fixtures__/data"

describe("export CalculatedFields to YAML", () => {
  it("exports YAML array", () => {
    const result = testExportPropertyToYAML({
      rule: { type: "CalculatedFields", yaml: "ВычисляемыеПоля" },
      value: calculatedFields,
    })

    expect(result).toEqual({ ВычисляемыеПоля: calculatedFieldsYAML })
  })
})
