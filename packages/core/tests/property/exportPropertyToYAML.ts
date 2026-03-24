import { exportPropertyToYAML, PropertyRule } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"

export const testExportPropertyToYAML = (params: {
  rule: PropertyRule
  value: unknown
}): unknown => {
  const { rule, value } = params

  const result = exportPropertyToYAML({
    context: mockContext,
    rule,
    value,
  })

  return result
}
