import { join } from "path"
import { rootFromYAML } from "../../commonObjects/metadataTargets/roots"
import type { ConfigurationContext } from "../../context/types"
import type { FormDataPathIndex } from "../../validation/dataPath/formIndex"
import { createFormDataPathIndexFromYAML } from "../../validation/dataPath/formYamlIndex"
import { collectFormDataPathOccurrencesFromYAML } from "../../validation/dataPath/formYamlTraversal"
import { createOwnerMetadataCache, type OwnerMetadataCache } from "../../validation/dataPath/ownerCache"
import { toDataPathPolicyInput, validateResolvedDataPathPolicy } from "../../validation/dataPath/policies"
import { resolveDataPath } from "../../validation/dataPath/resolver"
import {
  getFormWarningProviders,
  type RegisteredFormValidator,
  type RegisteredFormValidatorParams,
} from "../../validation/formValidationRegistry"
import { validateExcludedEqualNameYAML } from "../../validation/excludeIfEqualNameYAML"
import type { Diagnostic } from "../../validation/types"
import { dedupeDiagnostics } from "../../validation/diagnostics"
import { diagnosticAtYamlPath, type YamlPath } from "../../validation/yamlLocations"
import type { ParsedYaml } from "../../../yaml/parseMetadataYaml"
import { ClientApplicationFormRules } from "./rules"
import { validateFormElementNames } from "./validateElementNames"
import { validateDynamicListTableProperties } from "../elements/table/validateDynamicListProperties"
import { hasMainAttributeKind } from "./mainAttributeKinds"
import { collectFormTableDataPathsFromYAML } from "./formTableDataPaths"

const DOCUMENT_MAIN_ATTRIBUTE_KINDS = new Set(["ДокументОбъект"])
const REPORT_MAIN_ATTRIBUTE_KINDS = new Set(["ОтчетОбъект"])
const DOCUMENT_FORM_PROPERTIES = ["АвтоВремя", "РежимПроведения", "ПерепроводитьПриЗаписи"] as const
const REPORT_FORM_PROPERTIES = [
  "ТипФормыОтчета",
  "АвтоОтображениеСостояния",
  "РежимОтображенияРезультатаОтчета",
  "ПрименениеРежимаОтображенияПриУстановкеРезультатаОтчета",
] as const

interface ClientApplicationFormValidationState {
  filePath: string
  parsed: ParsedYaml
  index: FormDataPathIndex
  occurrences: ReturnType<typeof collectFormDataPathOccurrencesFromYAML>
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
  const index = createFormDataPathIndexFromYAML(
    entry.parsed.data,
    collectFormTableDataPathsFromYAML(entry.parsed.data)
  )
  const localDiagnostics: Diagnostic[] = []
  const occurrences = collectFormDataPathOccurrencesFromYAML({
    yaml: entry.parsed.data,
    rule: ClientApplicationFormRules,
    visitItem: (visit) => {
      localDiagnostics.push(
        ...validateDynamicListTableProperties({
          filePath: entry.filePath,
          parsed: entry.parsed,
          index,
          visit,
        })
      )
    },
  })
  const diagnostics = [
    ...validateExcludedEqualNameYAML({
      filePath: entry.filePath,
      parsed: entry.parsed,
      rule: ClientApplicationFormRules,
      context,
      name: params.formName,
    }),
    ...validateFormElementNames({
      filePath: entry.filePath,
      parsed: entry.parsed,
      value: entry.parsed.data,
      yamlPath: [],
      rule: ClientApplicationFormRules,
    }),
    ...index.duplicateDiagnostics,
    ...validateContextualFormProperties({
      filePath: entry.filePath,
      parsed: entry.parsed,
      index,
    }),
    ...localDiagnostics,
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
      index,
      occurrences,
    },
  }
}

function validateContextualFormProperties(params: {
  filePath: string
  parsed: ParsedYaml
  index: FormDataPathIndex
}): Diagnostic[] {
  const yaml = isRecord(params.parsed.data) ? params.parsed.data : {}
  const attributes = yaml["Реквизиты"]
  const diagnostics: Diagnostic[] = []

  collectContextualPropertyDiagnostics({
    ...params,
    yaml,
    attributes,
    properties: DOCUMENT_FORM_PROPERTIES,
    kinds: DOCUMENT_MAIN_ATTRIBUTE_KINDS,
    kindName: "ДокументОбъект",
    diagnostics,
  })
  collectContextualPropertyDiagnostics({
    ...params,
    yaml,
    attributes,
    properties: REPORT_FORM_PROPERTIES,
    kinds: REPORT_MAIN_ATTRIBUTE_KINDS,
    kindName: "ОтчетОбъект",
    diagnostics,
  })

  return diagnostics
}

function collectContextualPropertyDiagnostics(params: {
  filePath: string
  parsed: ParsedYaml
  index: FormDataPathIndex
  yaml: Record<string, unknown>
  attributes: unknown
  properties: readonly string[]
  kinds: ReadonlySet<string>
  kindName: string
  diagnostics: Diagnostic[]
}): void {
  if (hasMainAttributeKind(params.attributes, params.index, params.kinds)) return

  for (const property of params.properties) {
    if (!Object.prototype.hasOwnProperty.call(params.yaml, property)) continue
    params.diagnostics.push(
      diagnosticAtYamlPath({
        filePath: params.filePath,
        parsed: params.parsed,
        path: [property],
        severity: "error",
        source: "structure",
        message: `Свойство ${property} допустимо только для формы с основным реквизитом ${params.kindName}.`,
      })
    )
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
        rule: toDataPathPolicyInput(occurrence.rule),
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
  occurrence: ReturnType<typeof collectFormDataPathOccurrencesFromYAML>[number]
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
  const leftValue = params.value["ЛевоеЗначение"]
  if (isMetadataObjectTargetYAML(rightValue) && !isDynamicListTypeDiscriminatorComparison(leftValue)) {
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

function isDynamicListTypeDiscriminatorComparison(value: unknown): boolean {
  return value === ".Тип" || value === "Тип"
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

function defaultValidationContext(): ConfigurationContext {
  return {
    version: "2.20",
    defaultLanguage: "ru",
    exportToYAML: { toTyped: false },
  }
}
