import type { DataPathAllowedKind, DataPathPropertyRule } from "../../orchestration/property/types"
import type { ElementType } from "../../orchestration"
import type { ParsedYaml } from "../../../yaml/parseMetadataYaml"
import type { Diagnostic } from "../types"
import {
  diagnosticAtYamlLocation,
  yamlDiagnosticLocationAtPath,
  type YamlDiagnosticLocation,
  type YamlPath,
} from "../yamlLocations"
import type { ResolvedDataPathTarget } from "./resolver"

export type DataPathTargetKind = DataPathAllowedKind

export interface DataPathPolicyInput {
  readonly yaml: string
  readonly allowedKinds?: readonly DataPathTargetKind[]
  readonly allowComposite?: boolean
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
  const message = evaluateDataPathPolicy(params.rule, params.target, {
    value: params.value,
    elementType: params.elementType,
    hasValuesPicture: params.hasValuesPicture,
  })
  return message === undefined ? [] : [policyDiagnostic(params, message)]
}

export function evaluateDataPathPolicy(
  input: DataPathPolicyInput,
  value: ResolvedDataPathTarget | undefined,
  context: { value?: string; elementType?: ElementType; hasValuesPicture?: boolean } = {}
): string | undefined {
  const allowedKinds = input.allowedKinds
  if (allowedKinds === undefined) return undefined

  const displayedValue = context.value ?? value?.value ?? ""
  if (value === undefined || value.typeInfo.kinds.length === 0 || hasUnknownTerminalType(value)) {
    return `ПутьКДанным "${displayedValue}": не удалось определить конечный тип`
  }

  if (input.allowComposite !== true && isCompositeTerminal(value)) {
    return `ПутьКДанным "${displayedValue}": конечный реквизит имеет составной тип`
  }

  if (
    isPictureFieldValuesPictureTableSource({
      rule: input,
      target: value,
      elementType: context.elementType,
      hasValuesPicture: context.hasValuesPicture,
    })
  )
    return undefined

  if (value.typeInfo.kinds.some((kind) => allowedKinds.some((allowedKind) => allowedKind === kind))) return undefined

  return `ПутьКДанным "${displayedValue}": конечный тип не подходит, ожидается ${allowedKinds.join(" или ")}`
}

function isPictureFieldValuesPictureTableSource(params: {
  rule: DataPathPolicyInput
  target: ResolvedDataPathTarget
  elementType?: ElementType
  hasValuesPicture?: boolean
}): boolean {
  return (
    params.rule.yaml === "ПутьКДанным" &&
    params.hasValuesPicture === true &&
    (params.elementType === "PictureField" || params.elementType === "TablePictureField") &&
    params.target.typeInfo.kinds.includes("tableSource")
  )
}

function isCompositeTerminal(target: ResolvedDataPathTarget): boolean {
  return target.typeInfo.isComposite === true || target.typeInfo.nextTypes.length > 1
}

function hasUnknownTerminalType(target: ResolvedDataPathTarget): boolean {
  return target.typeInfo.kinds.includes("unknown") || target.typeInfo.kinds.includes("any")
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
