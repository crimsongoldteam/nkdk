import { describe, expect, it } from "vitest"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import { fullCalculatedField, fullCalculatedFieldYAML } from "./__fixtures__/data"
import "./types"

describe("import CalculatedField from YAML", () => {
  it("imports full YAML", () => {
    const result = testImportPropertyFromYAML({
      rule: { type: "CalculatedField" },
      value: fullCalculatedFieldYAML,
    })

    expect(result).toEqual(fullCalculatedField)
  })
})
