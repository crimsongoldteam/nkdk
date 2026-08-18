import type { ConfigurationContext, ParsedYaml } from "@nkdk/runtime"
import {
  checkDataPathTraceAvailability,
  normalizeDataPathTerminalType,
  type NormalizedDataPathTerminalType,
} from "@nkdk/runtime/rule-kit"
import type { OwnerMetadataCache } from "../../validation/dataPath/ownerCache"
import { resolveDataPath, type ResolvedDataPathTarget } from "../../validation/dataPath/resolver"
import { dataPathTerminalGroupsIntersect } from "../../validation/dataPath/terminalTypes"
import type { Diagnostic } from "../../validation/types"
import { diagnosticAtYamlPath } from "../../validation/yamlLocations"
import {
  collectConditionalAppearanceOccurrences,
  type ConditionalOperandOccurrence,
  type ConditionalTargetOccurrence,
} from "./conditionalAppearanceTraversal"
import { inferConditionalOperandType } from "./conditionalOperandTypes"
import type { FormDataPathContext } from "./formDataPathContext"

export type ConditionalFieldResolution =
  | { readonly status: "tagged" | "empty" }
  | { readonly status: "resolved"; readonly target: ResolvedDataPathTarget; readonly diagnostics: readonly Diagnostic[] }
  | { readonly status: "unavailable" | "deferred" | "error"; readonly diagnostics: readonly Diagnostic[] }

export function validateFormConditionalAppearance(params: {
  filePath: string
  parsed: ParsedYaml
  context: ConfigurationContext
  dataPathContext: FormDataPathContext
  ownerCache: OwnerMetadataCache
}): Diagnostic[] {
  const occurrences = collectConditionalAppearanceOccurrences(params.parsed.data)
  const diagnostics: Diagnostic[] = []

  for (const target of occurrences.targets) {
    if (target.tagged) continue
    if (target.tableContext === undefined) {
      if (!params.dataPathContext.elementsByName.has(target.value)) {
        diagnostics.push(atPath(params, target.yamlPath, `Неизвестный оформляемый элемент формы "${target.value}".`))
      }
      continue
    }
    const resolution = resolveConditionalAppearanceTarget({ ...params, occurrence: target })
    if ("diagnostics" in resolution) diagnostics.push(...resolution.diagnostics)
  }

  const typesByComparison = new Map<string, Partial<Record<"left" | "right", NormalizedDataPathTerminalType>>>()
  for (const operand of occurrences.operands) {
    if (operand.tagged) continue
    const inferred = inferConditionalOperandType({ context: params.context, value: operand.value })
    let normalized: NormalizedDataPathTerminalType | undefined

    if (inferred.kind === "field") {
      const resolution = resolveConditionalAppearanceField({ ...params, occurrence: operand })
      if ("diagnostics" in resolution) diagnostics.push(...resolution.diagnostics)
      if (resolution.status === "resolved") normalized = normalizeDataPathTerminalType(resolution.target.typeInfo)
    } else if (inferred.kind === "typed") {
      normalized = normalizeDataPathTerminalType(inferred.typeInfo)
    }

    if (normalized === undefined) continue
    const key = JSON.stringify(operand.comparisonPath)
    const pair = typesByComparison.get(key) ?? {}
    pair[operand.side] = normalized
    typesByComparison.set(key, pair)
  }

  for (const operand of occurrences.operands) {
    if (operand.side !== "right") continue
    const pair = typesByComparison.get(JSON.stringify(operand.comparisonPath))
    if (pair?.left === undefined || pair.right === undefined) continue
    if (dataPathTerminalGroupsIntersect(pair.left, pair.right) !== false) continue
    diagnostics.push(atPath(
      params,
      operand.yamlPath,
      `Типы операндов условного оформления несовместимы: ${pair.left.display} и ${pair.right.display}.`,
    ))
  }

  return diagnostics
}

export function resolveConditionalAppearanceField(params: {
  filePath: string
  parsed: ParsedYaml
  dataPathContext: FormDataPathContext
  ownerCache: OwnerMetadataCache
  occurrence: ConditionalOperandOccurrence
}): ConditionalFieldResolution {
  const { occurrence } = params
  if (occurrence.tagged) return { status: "tagged" }
  if (occurrence.value === ".") return { status: "empty" }
  if (typeof occurrence.value !== "string") return { status: "deferred", diagnostics: [] }

  return resolveConditionalAppearanceDataPath({ ...params, occurrence, subject: "поле" })
}

function resolveConditionalAppearanceTarget(params: {
  filePath: string
  parsed: ParsedYaml
  dataPathContext: FormDataPathContext
  ownerCache: OwnerMetadataCache
  occurrence: ConditionalTargetOccurrence
}): ConditionalFieldResolution {
  if (params.occurrence.tagged) return { status: "tagged" }
  return resolveConditionalAppearanceDataPath({ ...params, subject: "оформляемое поле" })
}

function resolveConditionalAppearanceDataPath(params: {
  filePath: string
  parsed: ParsedYaml
  dataPathContext: FormDataPathContext
  ownerCache: OwnerMetadataCache
  occurrence: Pick<ConditionalOperandOccurrence | ConditionalTargetOccurrence, "value" | "yamlPath" | "tableContext">
  subject: "поле" | "оформляемое поле"
}): ConditionalFieldResolution {
  const { occurrence } = params
  if (typeof occurrence.value !== "string") return { status: "deferred", diagnostics: [] }
  const relative = occurrence.value.replace(/^\./, "")
  const resolverValue = occurrence.tableContext === undefined ? relative : `${occurrence.tableContext.dataPath}.${relative}`
  const result = resolveDataPath({
    filePath: params.filePath,
    parsed: params.parsed,
    yamlPath: occurrence.yamlPath,
    value: resolverValue,
    index: params.dataPathContext.index,
    ownerCache: params.ownerCache,
  })
  if (result.status === "error") return { status: "error", diagnostics: result.diagnostics }
  if (result.target === undefined) {
    return {
      status: "deferred",
      diagnostics: [
        ...result.diagnostics,
        atPath(params, occurrence.yamlPath, `Не удалось определить ${params.subject} "${resolverValue}" условного оформления.`),
      ],
    }
  }
  if (!checkDataPathTraceAvailability("formConditionalFilter", result.target.trace ?? [])) {
    const leaf = resolverValue.split(".").at(-1) ?? resolverValue
    return {
      status: "unavailable",
      diagnostics: [
        ...result.diagnostics,
        atPath(params, occurrence.yamlPath, `${capitalize(params.subject)} "${resolverValue}": свойство "${leaf}" недоступно в условном оформлении формы.`),
      ],
    }
  }
  return { status: "resolved", target: result.target, diagnostics: result.diagnostics }
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function atPath(
  params: { filePath: string; parsed: ParsedYaml },
  path: readonly (string | number)[],
  message: string,
): Diagnostic {
  return diagnosticAtYamlPath({
    filePath: params.filePath,
    parsed: params.parsed,
    path,
    severity: "error",
    source: "structure",
    message,
  })
}
