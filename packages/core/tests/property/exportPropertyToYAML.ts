import { exportPropertyToYAML, PropertyRule } from "../../metadata/ruleRuntime"
import { mockContext } from "../mockContext"

export const testExportPropertyToYAML = (params: { rule: PropertyRule; value: unknown; name?: string }): unknown => {
  const { rule, value, name } = params

  const result = exportPropertyToYAML({
    context: mockContext,
    rule,
    value,
    name,
  })

  return result
}
import { registerCommonObjects } from "../../metadata/commonObjects"

registerCommonObjects()
