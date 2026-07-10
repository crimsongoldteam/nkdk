import type { OwnerTypeRef } from "./dataPath/types"
import { resolveDataPath } from "./dataPath/resolver"
import { validateResolvedDataPathPolicy } from "./dataPath/policies"
import type { FormDataPathIndex } from "./dataPath/formIndex"
import type { OwnerMetadataCache } from "./dataPath/ownerCache"
import type { DataPathPropertyRule } from "../orchestration/property/types"
import type { ElementType } from "../orchestration/formElement/types"
import type { ParsedYaml } from "../../yaml/parseMetadataYaml"
import type { Diagnostic } from "./types"
import type { YamlPath } from "./yamlLocations"

export type ValidationPendingCheck = {
  kind: "dataPath"
  filePath: string
  parsed: ParsedYaml
  yamlPath: YamlPath
  owner: OwnerTypeRef
  value: string
  index: FormDataPathIndex
  rule: DataPathPropertyRule
  elementType?: ElementType
  hasValuesPicture?: boolean
  tableContext?: { dataPath: string }
  policy: "formDataPath"
}

export interface ValidationPendingCheckResult {
  diagnostics: Diagnostic[]
}

export function validatePendingChecks(params: {
  ownerCache: OwnerMetadataCache
  checks: readonly ValidationPendingCheck[]
}): ValidationPendingCheckResult {
  const diagnostics: Diagnostic[] = []

  for (const check of params.checks) {
    if (check.kind !== "dataPath") continue
    const result = resolveDataPath({
      filePath: check.filePath,
      parsed: check.parsed,
      yamlPath: check.yamlPath,
      value: check.value,
      index: check.index,
      ownerCache: params.ownerCache,
      ...(check.tableContext === undefined ? {} : { tableContext: check.tableContext }),
    })

    diagnostics.push(...result.diagnostics)
    if (result.status === "error" || result.target === undefined) continue

    diagnostics.push(
      ...validateResolvedDataPathPolicy({
        filePath: check.filePath,
        parsed: check.parsed,
        yamlPath: check.yamlPath,
        value: check.value,
        rule: check.rule,
        target: result.target,
        ...(check.elementType === undefined ? {} : { elementType: check.elementType }),
        ...(check.hasValuesPicture === undefined ? {} : { hasValuesPicture: check.hasValuesPicture }),
      })
    )
  }

  return { diagnostics: dedupeDiagnostics(diagnostics) }
}

function dedupeDiagnostics(diagnostics: Diagnostic[]): Diagnostic[] {
  const seen = new Set<string>()
  return diagnostics.filter((diagnostic) => {
    const key = `${diagnostic.filePath}:${diagnostic.line}:${diagnostic.col}:${diagnostic.source}:${diagnostic.message}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
