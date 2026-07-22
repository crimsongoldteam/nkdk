import { callAtomicFromYAML } from "../../metadata/orchestration/property/fromYAMLToXML"
import type { PropertyRule } from "../../metadata/orchestration"
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
