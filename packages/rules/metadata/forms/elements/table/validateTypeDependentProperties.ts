import type { ParsedYaml } from "@nkdk/runtime"
import { getDataPathElementPropertyTerminalTypes } from "../../../validation/dataPath/registry"
import type { ResolvedDataPathTarget } from "../../../validation/dataPath/resolver"
import { normalizeDataPathTerminalType } from "../../../validation/dataPath/terminalTypes"
import type { FormYAMLItemVisit } from "../../../validation/dataPath/formYamlTraversal"
import { diagnosticAtYamlPath } from "../../../validation/yamlLocations"
import type { Diagnostic } from "../../../validation/types"

export function validateTypeDependentProperties(params: {
  filePath: string
  parsed: ParsedYaml
  visit: FormYAMLItemVisit
  target: ResolvedDataPathTarget
}): Diagnostic[] {
  const normalized = normalizeDataPathTerminalType(params.target.typeInfo)
  if (normalized.status !== "resolved") return []

  const diagnostics: Diagnostic[] = []
  for (const propertyYaml of Object.keys(params.visit.yaml)) {
    const allowed = getDataPathElementPropertyTerminalTypes(params.visit.rule.itemType, propertyYaml)
    if (allowed === undefined || normalized.groups.some((group) => allowed.includes(group))) continue
    diagnostics.push(diagnosticAtYamlPath({
      filePath: params.filePath,
      parsed: params.parsed,
      path: [...params.visit.yamlPath, propertyYaml],
      severity: "error",
      source: "structure",
      message: `Свойство ${propertyYaml} недоступно для конечного типа ${normalized.display}.`,
    }))
  }
  return diagnostics
}
