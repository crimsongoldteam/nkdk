import type {
  ConfigurationContext,
} from "../../context/types"
import type { PropertyRule } from "./types"

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

interface AtomicConversionExecution {
  getTypeRule(
    type: PropertyRule["type"],
    operation: "compileAtomicConversion",
  ): CompileAtomicConversionFunction | undefined
}

interface CompiledAtomicProperty {
  readonly atomicConversion: CompiledAtomicConversion | undefined
}

export function resolveAtomicConversion(params: {
  readonly rule: PropertyRule
  readonly execution?: AtomicConversionExecution
  readonly compiled?: CompiledAtomicProperty
  readonly getTypeRule?: AtomicConversionExecution["getTypeRule"]
}): CompiledAtomicConversion | undefined {
  if (params.compiled !== undefined) return params.compiled.atomicConversion
  return (params.execution?.getTypeRule(params.rule.type, "compileAtomicConversion")
    ?? params.getTypeRule?.(params.rule.type, "compileAtomicConversion"))?.({ rule: params.rule })
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
