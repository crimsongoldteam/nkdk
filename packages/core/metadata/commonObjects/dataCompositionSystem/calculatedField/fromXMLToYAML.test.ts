import { describe, expect, it } from "vitest"
import { testExportPropertyModelThroughXMLToYAML } from "../../../../tests/property/exportPropertyModelThroughXMLToYAML"
import {
  appearanceCalculatedField,
  appearanceCalculatedFieldYAML,
  availableValuesCalculatedField,
  availableValuesCalculatedFieldYAML,
  fullCalculatedField,
  fullCalculatedFieldYAML,
} from "./__fixtures__/data"
import "./types"

describe("export CalculatedField to YAML", () => {
  it("exports full YAML", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule: { type: "CalculatedField", yaml: "ВычисляемоеПоле" },
      value: fullCalculatedField,
      yaml: fullCalculatedFieldYAML,
    })

    expect(result).toEqual({ ВычисляемоеПоле: fullCalculatedFieldYAML })
  })

  it("exports appearance YAML", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule: { type: "CalculatedField", yaml: "ВычисляемоеПоле" },
      value: appearanceCalculatedField,
      yaml: appearanceCalculatedFieldYAML,
    })

    expect(result).toEqual({ ВычисляемоеПоле: appearanceCalculatedFieldYAML })
  })

  it("exports available values", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule: { type: "CalculatedField", yaml: "ВычисляемоеПоле" },
      value: availableValuesCalculatedField,
      yaml: availableValuesCalculatedFieldYAML,
    })

    expect(result).toEqual({ ВычисляемоеПоле: availableValuesCalculatedFieldYAML })
  })
})
