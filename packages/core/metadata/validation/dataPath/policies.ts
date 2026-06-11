import type { DataPathPropertyRule } from "~/metadata/orchestration/property/types"
import type { ParsedYaml } from "~/yaml/parseMetadataYaml"
import type { Diagnostic } from "../types"
import { diagnosticAtYamlPath, type YamlPath } from "../yamlLocations"
import type { ResolvedDataPathTarget } from "./resolver"

export function validateResolvedDataPathPolicy(params: {
  filePath: string
  parsed: ParsedYaml
  yamlPath: YamlPath
  value: string
  rule: DataPathPropertyRule
  target: ResolvedDataPathTarget | undefined
}): Diagnostic[] {
  const allowedKinds = params.rule.allowedKinds
  if (allowedKinds === undefined) return []

  const target = params.target
  if (target === undefined || target.typeInfo.kinds.length === 0 || hasUnknownTerminalType(target)) {
    return [policyDiagnostic(params, `ПутьКДанным "${params.value}": не удалось определить конечный тип`)]
  }

  if (params.rule.allowComposite !== true && isCompositeTerminal(target)) {
    return [policyDiagnostic(params, `ПутьКДанным "${params.value}": конечный реквизит имеет составной тип`)]
  }

  if (target.typeInfo.kinds.some((kind) => allowedKinds.some((allowedKind) => allowedKind === kind))) return []

  return [
    policyDiagnostic(
      params,
      `ПутьКДанным "${params.value}": конечный тип не подходит, ожидается ${allowedKinds.join(" или ")}`,
    ),
  ]
}

function isCompositeTerminal(target: ResolvedDataPathTarget): boolean {
  return target.typeInfo.isComposite === true || target.typeInfo.nextTypes.length > 1
}

function hasUnknownTerminalType(target: ResolvedDataPathTarget): boolean {
  return target.typeInfo.kinds.includes("unknown") || target.typeInfo.kinds.includes("any")
}

function policyDiagnostic(
  params: {
    filePath: string
    parsed: ParsedYaml
    yamlPath: YamlPath
  },
  message: string,
): Diagnostic {
  return diagnosticAtYamlPath({
    filePath: params.filePath,
    parsed: params.parsed,
    path: params.yamlPath,
    severity: "error",
    source: "structure",
    message,
  })
}
