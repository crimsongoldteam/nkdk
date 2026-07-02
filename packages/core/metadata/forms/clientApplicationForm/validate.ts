import { join } from "path"
import { rootFromYAML } from "../../commonObjects/metadataTargets/roots"
import type { ConfigurationContext } from "../../context/types"
import { buildFormDataPathIndex, type FormDataPathIndex } from "../../validation/dataPath/formIndex"
import { collectFormDataPathOccurrences } from "../../validation/dataPath/formTraversal"
import { createOwnerMetadataCache, type OwnerMetadataCache } from "../../validation/dataPath/ownerCache"
import { validateResolvedDataPathPolicy } from "../../validation/dataPath/policies"
import { resolveDataPath } from "../../validation/dataPath/resolver"
import {
  getFormWarningProviders,
  type RegisteredFormValidator,
  type RegisteredFormValidatorParams,
} from "../../validation/formValidationRegistry"
import { validateExcludedEqualNameYAML } from "../../validation/excludeIfEqualNameYAML"
import type { Diagnostic } from "../../validation/types"
import { diagnosticAtYamlPath, type YamlPath } from "../../validation/yamlLocations"
import type { ParsedYaml } from "../../../yaml/parseMetadataYaml"
import { importClientApplicationFormFromYAML } from "./fromYAML"
import { ClientApplicationFormRules } from "./rules"
import type { ClientApplicationFormYAML } from "./types"

interface ClientApplicationFormValidationState {
  filePath: string
  parsed: ParsedYaml
  form: ReturnType<typeof importClientApplicationFormFromYAML>
  index: FormDataPathIndex
  occurrences: ReturnType<typeof collectFormDataPathOccurrences>
}

export function validateClientApplicationFormFirstPass(
  params: RegisteredFormValidatorParams
):
  | { status: "ok"; diagnostics: Diagnostic[]; state: ClientApplicationFormValidationState }
  | { status: "failed"; diagnostics: Diagnostic[] } {
  const filePath = join(params.formDir, "Форма.yaml")
  const entry = params.cache.get(filePath)
  if ("error" in entry) {
    return { status: "failed", diagnostics: [readFormError(entry.filePath, params.formName, entry.error)] }
  }

  if (entry.parsed.syntaxErrors.length > 0) {
    return { status: "failed", diagnostics: syntaxDiagnostics(entry.filePath, entry.parsed) }
  }

  const context = params.context ?? defaultValidationContext()
  const form = importForm({ context, yaml: entry.parsed.data, filePath: entry.filePath })
  if ("diagnostics" in form) {
    return { status: "failed", diagnostics: params.suppressFormImportDiagnostics === true ? [] : form.diagnostics }
  }

  const index = buildFormDataPathIndex({
    filePath: entry.filePath,
    parsed: entry.parsed,
    form: form.value,
  })
  const diagnostics = [
    ...validateExcludedEqualNameYAML({
      filePath: entry.filePath,
      parsed: entry.parsed,
      rule: ClientApplicationFormRules,
      context,
      name: params.formName,
    }),
    ...index.duplicateDiagnostics,
  ]
  for (const provider of getFormWarningProviders()) {
    diagnostics.push(...provider({ filePath: entry.filePath, parsed: entry.parsed }))
  }

  return {
    status: "ok",
    diagnostics,
    state: {
      filePath: entry.filePath,
      parsed: entry.parsed,
      form: form.value,
      index,
      occurrences: collectFormDataPathOccurrences(form.value),
    },
  }
}

export function validateClientApplicationFormSecondPass(params: {
  state: ClientApplicationFormValidationState
  ownerCache: OwnerMetadataCache
}): Diagnostic[] {
  const diagnostics: Diagnostic[] = []

  for (const occurrence of params.state.occurrences) {
    if (isAcceptedOpaqueMultipleValueDataPath(occurrence)) continue

    const result = resolveDataPath({
      filePath: params.state.filePath,
      parsed: params.state.parsed,
      yamlPath: occurrence.yamlPath,
      value: occurrence.value,
      index: params.state.index,
      ownerCache: params.ownerCache,
      ...(occurrence.tableContext !== undefined ? { tableContext: occurrence.tableContext } : {}),
    })

    diagnostics.push(...result.diagnostics)
    if (result.status === "error" || result.target === undefined) continue

    diagnostics.push(
      ...validateResolvedDataPathPolicy({
        filePath: params.state.filePath,
        parsed: params.state.parsed,
        yamlPath: occurrence.yamlPath,
        value: occurrence.value,
        rule: occurrence.rule,
        target: result.target,
        ...(occurrence.elementType !== undefined ? { elementType: occurrence.elementType } : {}),
        ...(occurrence.hasValuesPicture !== undefined ? { hasValuesPicture: occurrence.hasValuesPicture } : {}),
      })
    )
  }

  return dedupeDiagnostics(diagnostics)
}

export const validateClientApplicationForm: RegisteredFormValidator = (params) => {
  const first = validateClientApplicationFormFirstPass(params)
  if (first.status === "failed") return first.diagnostics

  const context = params.context ?? defaultValidationContext()
  const ownerCache =
    params.ownerCache ??
    createOwnerMetadataCache({
      projectDir: params.projectDir,
      yamlCache: params.cache,
      context,
    })

  return dedupeDiagnostics([
    ...first.diagnostics,
    ...validateClientApplicationFormSecondPass({ state: first.state, ownerCache }),
  ])
}

function readFormError(filePath: string, formName: string, error: Error): Diagnostic {
  return {
    filePath,
    line: 1,
    col: 1,
    severity: "error",
    source: "external-file",
    message: `Не удалось прочитать форму "${formName}": ${error.message}`,
  }
}

function syntaxDiagnostics(filePath: string, parsed: ParsedYaml): Diagnostic[] {
  return parsed.syntaxErrors.map((error) => ({
    filePath,
    line: error.line,
    col: error.col,
    severity: "error" as const,
    source: "syntax" as const,
    message: error.message,
  }))
}

export function collectDynamicListTypeValueWarnings(params: { filePath: string; parsed: ParsedYaml }): Diagnostic[] {
  const data = params.parsed.data
  if (!isRecord(data)) return []

  const attributes = data["Реквизиты"]
  if (!isRecord(attributes)) return []

  const diagnostics: Diagnostic[] = []
  for (const [attributeName, attributeValue] of Object.entries(attributes)) {
    if (!isRecord(attributeValue)) continue

    const dynamicList = attributeValue["ДинамическийСписок"]
    if (!isRecord(dynamicList)) continue

    const conditionalAppearance = dynamicList["УсловноеОформление"]
    if (!isRecord(conditionalAppearance)) continue

    diagnostics.push(
      ...collectConditionalAppearanceTypeValueWarnings({
        filePath: params.filePath,
        parsed: params.parsed,
        rootPath: ["Реквизиты", attributeName, "ДинамическийСписок", "УсловноеОформление"],
        value: conditionalAppearance,
      })
    )
  }

  return diagnostics
}

function isAcceptedOpaqueMultipleValueDataPath(
  occurrence: ReturnType<typeof collectFormDataPathOccurrences>[number]
): boolean {
  return (
    occurrence.rule.allowOpaqueMultipleValue === true &&
    occurrence.hasMultipleValuesExtendedEdit === true &&
    /^[0-9]+\/[0-9]+:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
      occurrence.value
    )
  )
}

function collectConditionalAppearanceTypeValueWarnings(params: {
  filePath: string
  parsed: ParsedYaml
  rootPath: YamlPath
  value: unknown
}): Diagnostic[] {
  const diagnostics: Diagnostic[] = []
  visitConditionalAppearanceNode({
    filePath: params.filePath,
    parsed: params.parsed,
    path: params.rootPath,
    value: params.value,
    diagnostics,
  })
  return diagnostics
}

function visitConditionalAppearanceNode(params: {
  filePath: string
  parsed: ParsedYaml
  path: YamlPath
  value: unknown
  diagnostics: Diagnostic[]
}): void {
  if (Array.isArray(params.value)) {
    params.value.forEach((item, index) => {
      visitConditionalAppearanceNode({
        ...params,
        path: [...params.path, index],
        value: item,
      })
    })
    return
  }

  if (!isRecord(params.value)) return

  const rightValue = params.value["ПравоеЗначение"]
  if (isMetadataObjectTargetYAML(rightValue)) {
    params.diagnostics.push(
      diagnosticAtYamlPath({
        filePath: params.filePath,
        parsed: params.parsed,
        path: [...params.path, "ПравоеЗначение"],
        severity: "warning",
        source: "structure",
        message: `Проверка значения типа "${rightValue}" в условном оформлении динамического списка пока не реализована и будет добавлена в будущих версиях`,
      })
    )
  }

  for (const [key, value] of Object.entries(params.value)) {
    if (key === "ПравоеЗначение") continue
    visitConditionalAppearanceNode({
      ...params,
      path: [...params.path, key],
      value,
    })
  }
}

function isMetadataObjectTargetYAML(value: unknown): value is string {
  if (typeof value !== "string") return false

  const parts = value.split(".")
  if (parts.length !== 2) return false

  const [root, name] = parts
  return rootFromYAML[root] !== undefined && /^[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*$/.test(name)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function importForm(params: {
  context: ConfigurationContext
  yaml: unknown
  filePath: string
}): { value: ReturnType<typeof importClientApplicationFormFromYAML> } | { diagnostics: Diagnostic[] } {
  try {
    return {
      value: importClientApplicationFormFromYAML(params.context, params.yaml as ClientApplicationFormYAML),
    }
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : String(caught)
    return {
      diagnostics: [
        {
          filePath: params.filePath,
          line: 1,
          col: 1,
          severity: "error",
          source: "structure",
          message: `Не удалось импортировать форму: ${message}`,
        },
      ],
    }
  }
}

function diagnosticKey(diagnostic: Diagnostic): string {
  return [
    diagnostic.filePath,
    diagnostic.line,
    diagnostic.col,
    diagnostic.source,
    diagnostic.severity,
    diagnostic.path ?? "",
    diagnostic.message,
  ].join("\0")
}

function dedupeDiagnostics(diagnostics: Diagnostic[]): Diagnostic[] {
  const result: Diagnostic[] = []
  const seen = new Set<string>()
  for (const diagnostic of diagnostics) {
    const key = diagnosticKey(diagnostic)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(diagnostic)
  }
  return result
}

function defaultValidationContext(): ConfigurationContext {
  return {
    version: "2.20",
    defaultLanguage: "ru",
    exportToYAML: { toTyped: false },
  }
}
