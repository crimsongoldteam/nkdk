import { exportPropertyToYAML, PropertyRule } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"

export const testExportPropertyToYAML = (params: {
  rule: PropertyRule
  value: unknown
  name?: string
}): unknown => {
  const { rule, value, name } = params

  const result = exportPropertyToYAML({
    context: mockContext,
    rule,
    value,
    name,
  })

  return result
}
