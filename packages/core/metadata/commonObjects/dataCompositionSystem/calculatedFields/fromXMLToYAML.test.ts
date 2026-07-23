import { describe, expect, it } from "vitest"
import { testExportPropertyModelThroughXMLToYAML } from "../../../../tests/property/exportPropertyModelThroughXMLToYAML"
import { calculatedFields, calculatedFieldsYAML } from "./__fixtures__/data"

describe("export CalculatedFields to YAML", () => {
  it("exports YAML array", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule: { type: "CalculatedFields", yaml: "ВычисляемыеПоля" },
      value: calculatedFields,
      yaml: calculatedFieldsYAML,
    })

    expect(result).toEqual({ ВычисляемыеПоля: calculatedFieldsYAML })
  })
})
