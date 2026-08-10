import { callAtomicFromYAML } from "../../metadata/ruleRuntime/property/fromYAMLToXML"
import type { PropertyRule } from "../../metadata/ruleRuntime"
import { mockContext } from "../mockContext"

export const testAtomicFromYAML = (params: {
  rule: PropertyRule
  value: unknown
  sourceValue?: unknown
  name?: string
}): unknown =>
  callAtomicFromYAML({
    context: mockContext,
    rule: params.rule,
    value: params.value,
    referenceValue: params.sourceValue,
    name: params.name,
  })
import { registerCommonObjects } from "../../metadata/commonObjects"

registerCommonObjects()
