import { join } from "path"
import { rootFromYAML } from "~/metadata/commonObjects/metadataTargets/roots"
import type { ConfigurationContext } from "~/metadata/context/types"
import "~/metadata/forms"
import { importClientApplicationFormFromYAML } from "~/metadata/forms/clientApplicationForm/fromYAML"
import type { ClientApplicationFormYAML } from "~/metadata/forms/clientApplicationForm/types"
import type { ParsedYaml } from "~/yaml/parseMetadataYaml"
import { buildFormDataPathIndex } from "./dataPath/formIndex"
import { collectFormDataPathOccurrences } from "./dataPath/formTraversal"
import { createOwnerMetadataCache, type OwnerMetadataCache } from "./dataPath/ownerCache"
import { resolveDataPath } from "./dataPath/resolver"
import { validateResolvedDataPathPolicy } from "./dataPath/policies"
import type { ProjectYamlCache } from "./projectYamlCache"
import type { Diagnostic } from "./types"
import { diagnosticAtYamlPath, type YamlPath } from "./yamlLocations"

export interface ValidateFormParams {
  projectDir: string
  formDir: string
  formName: string
  owner: { dir: string; name: string }
  cache: ProjectYamlCache
  context?: ConfigurationContext
  ownerCache?: OwnerMetadataCache
  suppressFormImportDiagnostics?: boolean
}

export function validateForm(params: ValidateFormParams): Diagnostic[] {
  const filePath = join(params.formDir, "Форма.yaml")
  const entry = params.cache.get(filePath)
  if ("error" in entry) {
    return [
      {
        filePath: entry.filePath,
        line: 1,
        col: 1,
        severity: "error",
        source: "external-file",
        message: `Не удалось прочитать форму "${params.formName}": ${entry.error.message}`,
      },
    ]
  }

  if (entry.parsed.doc.errors.length > 0) {
    return entry.parsed.doc.errors.map((error) => {
      const position = entry.parsed.lineCounter.linePos(error.pos[0])
      return {
        filePath: entry.filePath,
        line: position.line,
        col: position.col,
        severity: "error" as const,
        source: "syntax" as const,
        message: error.message,
      }
    })
  }

  const context = params.context ?? defaultValidationContext()
  const form = importForm({ context, yaml: entry.parsed.data, filePath: entry.filePath })
  if ("diagnostics" in form) return params.suppressFormImportDiagnostics === true ? [] : form.diagnostics

  const index = buildFormDataPathIndex({
    filePath: entry.filePath,
    parsed: entry.parsed,
    form: form.value,
  })
  const diagnostics = [...index.duplicateDiagnostics]
  diagnostics.push(
    ...collectDynamicListTypeValueWarnings({
      filePath: entry.filePath,
      parsed: entry.parsed,
    }),
  )
  const ownerCache =
    params.ownerCache ??
    createOwnerMetadataCache({
      projectDir: params.projectDir,
      yamlCache: params.cache,
      context,
    })

  for (const occurrence of collectFormDataPathOccurrences(form.value)) {
    const result = resolveDataPath({
      filePath: entry.filePath,
      parsed: entry.parsed,
      yamlPath: occurrence.yamlPath,
      value: occurrence.value,
      index,
      ownerCache,
      ...(occurrence.tableContext !== undefined ? { tableContext: occurrence.tableContext } : {}),
    })

    diagnostics.push(...result.diagnostics)
    if (result.status === "error" || result.target === undefined) continue

    diagnostics.push(
      ...validateResolvedDataPathPolicy({
        filePath: entry.filePath,
        parsed: entry.parsed,
        yamlPath: occurrence.yamlPath,
        value: occurrence.value,
        rule: occurrence.rule,
        target: result.target,
      }),
    )
  }

  return dedupeDiagnostics(diagnostics)
}

function collectDynamicListTypeValueWarnings(params: {
  filePath: string
  parsed: ParsedYaml
}): Diagnostic[] {
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
      }),
    )
  }

  return diagnostics
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
      }),
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
