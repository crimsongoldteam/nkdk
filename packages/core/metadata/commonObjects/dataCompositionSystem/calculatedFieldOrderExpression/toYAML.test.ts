import { describe, expect, it } from "vitest"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
import { fullOrderExpressions, fullOrderExpressionsYAML } from "./__fixtures__/data"
import "./types"

describe("export CalculatedFieldOrderExpression to YAML", () => {
  it("exports full YAML", () => {
    const result = testExportPropertyToYAML({
      rule: { type: "CalculatedFieldOrderExpression", yaml: "ВыраженияУпорядочивания" },
      value: fullOrderExpressions,
    })

    expect(result).toEqual({ ВыраженияУпорядочивания: fullOrderExpressionsYAML })
  })
})
