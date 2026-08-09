import type { OwnerTypeRef } from "./dataPath/types"
import { resolveDataPath } from "./dataPath/resolver"
import { validateResolvedDataPathPolicy } from "./dataPath/policies"
import type { FormDataPathIndex } from "./dataPath/formIndex"
import type { OwnerMetadataCache } from "./dataPath/ownerCache"
import type { DataPathPolicyInput } from "./dataPath/policies"
import type { ElementType } from "../ruleRuntime/formElement/types"
import type { Diagnostic } from "./types"
import type { YamlDiagnosticLocation, YamlPath } from "./yamlLocations"
import { diagnosticAtYamlLocation } from "./yamlLocations"
import type { TypeDescriptionView } from "../ruleRuntime/property/typeDescriptionView"
import type { FillValueTypedValue } from "../ruleRuntime/property/fillValueSemantics"
import { classifyFillValue, effectiveFillValueType, fillValueDiagnostic } from "../ruleRuntime/property/fillValueSemantics"

export type ValidationPendingCheck =
  | {
      kind: "dataPath"
      yamlPath: YamlPath
      location: YamlDiagnosticLocation
      owner: OwnerTypeRef
      value: string
      index: FormDataPathIndex
      policyInput: DataPathPolicyInput
      elementType?: ElementType
      hasValuesPicture?: boolean
      tableContext?: { dataPath: string }
      policy: "formDataPath"
    }
  | {
      kind: "fillValue"
      yamlPath: YamlPath
      location: YamlDiagnosticLocation
      itemType: string
      type: TypeDescriptionView
      value: FillValueTypedValue
      tagged: boolean
      transport?: "DesignTimeRef"
    }

export type DataPathValidationPendingCheck = Extract<ValidationPendingCheck, { kind: "dataPath" }>

export interface ValidationPendingCheckResult {
  diagnostics: Diagnostic[]
}

export function validatePendingChecks(params: {
  ownerCache: OwnerMetadataCache
  checks: readonly ValidationPendingCheck[]
}): ValidationPendingCheckResult {
  const diagnostics: Diagnostic[] = []

  for (const check of params.checks) {
    if (check.kind === "fillValue") {
      diagnostics.push(...validateFillValueCheck(params.ownerCache, check))
      continue
    }
    const result = resolveDataPath({
      location: check.location,
      value: check.value,
      index: check.index,
      ownerCache: params.ownerCache,
      ...(check.tableContext === undefined ? {} : { tableContext: check.tableContext }),
    })

    diagnostics.push(...result.diagnostics)
    if (result.status === "error" || result.target === undefined) continue

    diagnostics.push(
      ...validateResolvedDataPathPolicy({
        location: check.location,
        value: check.value,
        rule: check.policyInput,
        target: result.target,
        ...(check.elementType === undefined ? {} : { elementType: check.elementType }),
        ...(check.hasValuesPicture === undefined ? {} : { hasValuesPicture: check.hasValuesPicture }),
      })
    )
  }

  return { diagnostics: dedupeDiagnostics(diagnostics) }
}

function validateFillValueCheck(
  ownerCache: OwnerMetadataCache,
  check: Extract<ValidationPendingCheck, { kind: "fillValue" }>,
): Diagnostic[] {
  const effectiveType = effectiveFillValueType(check.type, (name) => {
    const result = ownerCache.get({ kind: "ОпределяемыйТип", name })
    if (result.status === "ok") return { status: "ok", type: result.owner.facts.type }
    const reason = result.diagnostics.map(({ message }) => message).join("; ")
    return { status: "unresolved", reason: reason || `не найден определяемый тип ${name}` }
  })
  const classification = classifyFillValue({ effectiveType, value: check.value })
  const problem = check.transport === "DesignTimeRef"
    ? effectiveType.status === "unresolved"
      ? fillValueDiagnostic(classification, false)
      : effectiveType.status === "known" && effectiveType.alternatives.some(({ kind }) => kind === "reference")
        ? undefined
        : { message: "DesignTimeRef допустим только для ссылочного типа", severity: "error" as const }
    : fillValueDiagnostic(classification, effectiveType.status === "unresolved" ? false : check.tagged)
  return problem === undefined
    ? []
    : [diagnosticAtYamlLocation({
        location: check.location,
        severity: problem.severity,
        source: effectiveType.status === "unresolved" ? "cross-file" : "structure",
        message: problem.message,
      })]
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
