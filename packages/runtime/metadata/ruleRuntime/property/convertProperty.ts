import type { ConfigurationContextFromXML } from "../../context/types"
import type { AtomicConversionResult } from "./atomicConversion"
import { resolveAtomicConversion } from "./atomicConversion"
import type { CompiledProperty } from "./compiledPropertyPlan"
import type { PropertyRuleExecution } from "./fn"
import { importPropertyFromXML } from "./fromXML"
import { exportPropertyValueToYAML } from "./toYAML"
import { getTypeRule } from "./typeRuleRegistry"
import type { PropertyRule } from "./types"

export function convertPropertyFromXMLToYAML(params: {
  readonly context: ConfigurationContextFromXML
  readonly rule: PropertyRule
  readonly value: unknown
  readonly name?: string
  readonly execution?: PropertyRuleExecution
  readonly compiled?: CompiledProperty
  readonly preserveImplicitValue?: boolean
}): AtomicConversionResult {
  const conversion = resolveAtomicConversion({ ...params, getTypeRule })
  if (conversion !== undefined) {
    return conversion.fromXMLToYAML({ context: params.context, value: params.value })
  }

  const metadataValue = importPropertyFromXML(params)
  return {
    metadataValue,
    representationValue: exportPropertyValueToYAML({
      ...params,
      value: metadataValue,
    }),
  }
}
