import { describe, expect, it } from "vitest"
import { testExportPropertyModelThroughXMLToYAML } from "../../../../tests/property/exportPropertyModelThroughXMLToYAML"
import { fullOrderExpressions, fullOrderExpressionsYAML } from "./__fixtures__/data"
import "./types"

describe("export CalculatedFieldOrderExpression to YAML", () => {
  it("exports full YAML", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule: { type: "CalculatedFieldOrderExpression", yaml: "ВыраженияУпорядочивания" },
      value: fullOrderExpressions,
      yaml: fullOrderExpressionsYAML,
    })

    expect(result).toEqual({ ВыраженияУпорядочивания: fullOrderExpressionsYAML })
  })
})
