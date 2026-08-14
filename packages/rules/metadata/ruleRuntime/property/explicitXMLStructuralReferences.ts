import type { StructuralReferenceRuntime } from "@nkdk/runtime"
import type { PropertyRuleExecution } from "@nkdk/runtime/rule-kit"

type OmittedExplicitXMLPropertyParams = Parameters<
  StructuralReferenceRuntime["omittedExplicitXMLPropertyKeys"]
>[0]

export function collectOmittedExplicitXMLPropertyKeys(
  execution: PropertyRuleExecution | undefined,
  params: OmittedExplicitXMLPropertyParams,
): ReadonlySet<string> {
  if (execution === undefined) return new Set()
  const actions = execution.collectExplicitXMLPropertyActions(params)
  return new Set(
    [...actions].flatMap(([propertyKey, action]) => action.kind === "omit" ? [propertyKey] : []),
  )
}
