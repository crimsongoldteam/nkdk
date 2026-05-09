import { describe, expect, it } from "vitest"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
import {
  appearanceCalculatedField,
  appearanceCalculatedFieldYAML,
  fullCalculatedField,
  fullCalculatedFieldYAML,
} from "./__fixtures__/data"
import "./types"

describe("export CalculatedField to YAML", () => {
  it("exports full YAML", () => {
    const result = testExportPropertyToYAML({
      rule: { type: "CalculatedField", yaml: "ВычисляемоеПоле" },
      value: fullCalculatedField,
    })

    expect(result).toEqual({ ВычисляемоеПоле: fullCalculatedFieldYAML })
  })

  it("exports appearance YAML", () => {
    const result = testExportPropertyToYAML({
      rule: { type: "CalculatedField", yaml: "ВычисляемоеПоле" },
      value: appearanceCalculatedField,
    })

    expect(result).toEqual({ ВычисляемоеПоле: appearanceCalculatedFieldYAML })
  })
})
