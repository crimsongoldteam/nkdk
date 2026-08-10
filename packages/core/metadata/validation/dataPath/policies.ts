import type { DataPathAllowedKind, DataPathPropertyRule } from "../../ruleRuntime/property/types"
import type { ElementType } from "../../ruleRuntime"
import type { ParsedYaml } from "../../../yaml/parseMetadataYaml"
import type { Diagnostic } from "../types"
import {
  diagnosticAtYamlLocation,
  yamlDiagnosticLocationAtPath,
  type YamlDiagnosticLocation,
  type YamlPath,
} from "../yamlLocations"
import type { ResolvedDataPathTarget } from "./resolver"
import { normalizeDataPathTerminalType } from "./terminalTypes"

export type DataPathTargetKind = DataPathAllowedKind

export interface DataPathPolicyInput {
  readonly yaml: string
  readonly allowedKinds?: readonly DataPathTargetKind[]
  readonly allowComposite?: boolean
}

export type DataPathCompatibilityResult =
  | { status: "notConfigured" | "notResolved" | "compatible" }
  | {
      status: "incompatible"
      actual: string
      expected: readonly DataPathAllowedKind[]
      reason: "kind" | "composite"
    }

export function toDataPathPolicyInput(rule: DataPathPropertyRule): DataPathPolicyInput {
  if (typeof rule.yaml !== "string") throw new Error("DataPath policy requires a YAML property name")
  return {
    yaml: rule.yaml,
    allowedKinds: rule.allowedKinds,
    allowComposite: rule.allowComposite,
  }
}

type DataPathPolicyParams = {
  value: string
  rule: DataPathPolicyInput
  target: ResolvedDataPathTarget | undefined
  elementType?: ElementType
  hasValuesPicture?: boolean
} & ({ location: YamlDiagnosticLocation } | { filePath: string; parsed: ParsedYaml; yamlPath: YamlPath })

export function validateResolvedDataPathPolicy(params: DataPathPolicyParams): Diagnostic[] {
  const compatibility = evaluateDataPathCompatibility({
    rule: params.rule,
    target: params.target,
    hasValuesPicture: params.hasValuesPicture,
  })
  const message =
    compatibility.status === "incompatible"
      ? incompatibilityMessage(params.value, compatibility)
      : undefined
  return message === undefined ? [] : [policyDiagnostic(params, message)]
}

export function evaluateDataPathCompatibility(params: {
  rule: DataPathPolicyInput
  target: ResolvedDataPathTarget | undefined
  hasValuesPicture?: boolean
}): DataPathCompatibilityResult {
  const allowedKinds = params.rule.allowedKinds
  if (allowedKinds === undefined) return { status: "notConfigured" }
  if (params.target === undefined) return { status: "notResolved" }

  const normalized = normalizeDataPathTerminalType(params.target.typeInfo)
  if (normalized.status === "notResolved") return { status: "notResolved" }
  if (normalized.composite) {
    return params.rule.allowComposite === true
      ? { status: "compatible" }
      : {
          status: "incompatible",
          reason: "composite",
          actual: normalized.display,
          expected: allowedKinds,
        }
  }

  if (
    params.rule.yaml === "ПутьКДанным" &&
    params.hasValuesPicture === true &&
    normalized.groups.length === 1 &&
    normalized.groups[0] === "ValueTable"
  )
    return { status: "compatible" }

  return normalized.groups.some((group) => allowedKinds.includes(group))
    ? { status: "compatible" }
    : {
        status: "incompatible",
        reason: "kind",
        actual: normalized.display,
        expected: allowedKinds,
      }
}

export function evaluateDataPathPolicy(
  input: DataPathPolicyInput,
  value: ResolvedDataPathTarget | undefined,
  context: { value?: string; elementType?: ElementType; hasValuesPicture?: boolean } = {}
): string | undefined {
  const compatibility = evaluateDataPathCompatibility({
    rule: input,
    target: value,
    hasValuesPicture: context.hasValuesPicture,
  })
  return compatibility.status === "incompatible"
    ? incompatibilityMessage(context.value ?? value?.value ?? "", compatibility)
    : undefined
}

function incompatibilityMessage(value: string, result: Extract<DataPathCompatibilityResult, { status: "incompatible" }>): string {
  const reason = result.reason === "composite" ? "составной конечный тип" : "конечный тип не подходит"
  return `ПутьКДанным "${value}": ${reason} ${result.actual}, ожидается ${result.expected.join(" или ")}`
}

function policyDiagnostic(
  params: DataPathPolicyParams,
  message: string
): Diagnostic {
  return diagnosticAtYamlLocation({
    location:
      "location" in params
        ? params.location
        : yamlDiagnosticLocationAtPath({ filePath: params.filePath, parsed: params.parsed, path: params.yamlPath }),
    severity: "error",
    source: "structure",
    message,
  })
}
