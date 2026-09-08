import { callAtomicFromYAML } from "../../metadata/ruleRuntime/property/fromYAMLToXML"
import type { PropertyRule } from "../../metadata/ruleRuntime"
import { mockContext } from "../mockContext"

export const testAtomicFromYAML = (params: {
  rule: PropertyRule
  value: unknown
  sourceValue?: unknown
  name?: string
}): unknown => {
  const invocation = {
    context: mockContext,
    rule: params.rule,
    value: params.value,
    referenceValue: params.sourceValue,
    name: params.name,
  }
  return callAtomicFromYAML(invocation)
}
import { registerCommonObjects } from "../../metadata/commonObjects"

registerCommonObjects()
