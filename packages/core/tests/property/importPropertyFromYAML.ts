import { importPropertyFromYAML, PropertyRule } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"

export const testImportPropertyFromYAML = (params: {
  rule: PropertyRule
  value: unknown
  sourceValue?: unknown
}): unknown => {
  const { rule, value, sourceValue } = params

  return importPropertyFromYAML({
    context: mockContext,
    rule,
    value,
    sourceValue,
  })
}
