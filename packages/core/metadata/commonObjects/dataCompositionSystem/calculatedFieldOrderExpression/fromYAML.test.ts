import { describe, expect, it } from "vitest"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import { fullOrderExpressionsFromCompactYAML, fullOrderExpressionsYAML } from "./__fixtures__/data"
import "./types"

describe("import CalculatedFieldOrderExpression from YAML", () => {
  it("imports full YAML", () => {
    const result = testImportPropertyFromYAML({
      rule: { type: "CalculatedFieldOrderExpression" },
      value: fullOrderExpressionsYAML,
    })

    expect(result).toEqual(fullOrderExpressionsFromCompactYAML)
  })
})
