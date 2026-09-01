import type {
  ConfigurationContext,
} from "../../context/types"
import type { PropertyRule } from "./types"
import type { PropertyRuleExecution } from "./fn"
import type { CompiledProperty } from "./compiledPropertyPlan"
import { getTypeRule } from "./typeRuleRegistry"

export interface AtomicConversionResult<Representation = unknown> {
  readonly metadataValue: unknown
  readonly representationValue: Representation
}

export interface CompiledAtomicConversion {
  readonly fromXMLToYAML: (params: {
    readonly context: ConfigurationContext
    readonly value: unknown
  }) => AtomicConversionResult
  readonly fromYAMLToXML: (params: {
    readonly context: ConfigurationContext
    readonly value: unknown
  }) => AtomicConversionResult
}

export type CompileAtomicConversionFunction = (params: {
  readonly rule: PropertyRule
}) => CompiledAtomicConversion

export function resolveAtomicConversion(params: {
  readonly rule: PropertyRule
  readonly execution?: PropertyRuleExecution
  readonly compiled?: CompiledProperty
}): CompiledAtomicConversion | undefined {
  if (params.compiled !== undefined) return params.compiled.atomicConversion
  return (params.execution?.getTypeRule(params.rule.type, "compileAtomicConversion")
    ?? getTypeRule(params.rule.type, "compileAtomicConversion"))?.({ rule: params.rule })
}

export function canUseAtomicFromXMLToYAML(params: {
  readonly conversion: CompiledAtomicConversion | undefined
  readonly staticallyEligible: boolean
}): params is typeof params & {
  readonly conversion: CompiledAtomicConversion
} {
  return params.staticallyEligible && params.conversion !== undefined
}

export function canUseAtomicFromYAMLToXML(params: {
  readonly conversion: CompiledAtomicConversion | undefined
  readonly staticallyEligible: boolean
}): params is typeof params & {
  readonly conversion: CompiledAtomicConversion
} {
  return params.staticallyEligible && params.conversion !== undefined
}
