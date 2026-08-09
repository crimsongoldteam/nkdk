import type { ConfigurationContext } from "../../context/types"
import type { MetadataItemRule } from "../../ruleRuntime/property/types"
import type { ParsedYaml } from "../../../yaml/parseMetadataYaml"
import type {
  DependentItemParams,
  DependentYamlItemAnalysis,
  DependentYamlItemParams,
} from "../../ruleRuntime/property/dependentItemRegistry"
import { getStandardMembers } from "../../standardMembers/declarations"
import { importMetadataValueFromYAML } from "../metadataValue/fromYAML"
import type { MetadataValueYAML } from "../metadataValue/types"
import type { MetadataTypedValue } from "../metadataValue/types"
import { parseMetadataTargetFromModel, parseMetadataTargetFromYAML } from "../metadataTargets"
import { isMetadataRootName } from "../metadataTargets/roots"
import type { MetadataRootName, MetadataTargetConstraint } from "../metadataTargets/types"
import { materializeMetadataValueReference } from "../metadataTargets/referenceMaterializer"
import { importTypeDescriptionFromYAML } from "../typeDescription/fromYAML"
import type { TypeDescriptionYAML } from "../typeDescription/types"
import { classifyFillValue } from "./classify"
import { classifyStandardMemberFillValue, effectiveTypeFromTypeDescription } from "./effectiveType"
import type { FillValueClassification } from "./types"
import { diagnosticAtYamlPath } from "../../validation/yamlLocations"
import { xmlScalarTagPayload, yamlScalarTagAt } from "../../../yaml/scalarTags"

const validationContext: ConfigurationContext = { version: "2.20", defaultLanguage: "ru" }
const fillValueYamlKey = "ЗначениеЗаполнения"
const typeYamlKey = "Тип"
const ownerRoots: readonly MetadataRootName[] = [
  "Catalog",
  "Document",
  "ChartOfCharacteristicTypes",
  "ExchangePlan",
]

export function analyzeMetadataAttributeFillValue(params: DependentYamlItemParams): DependentYamlItemAnalysis {
  return analyzeFillValue(params, classifyMetadataAttributeFillValue)
}

export function analyzeStandardAttributeFillValue(params: DependentYamlItemParams): DependentYamlItemAnalysis {
  return analyzeFillValue(params, classifyStandardAttributeFillValue)
}

function analyzeFillValue(
  params: DependentYamlItemParams,
  classify: (params: DependentItemParams, value: NonNullable<ReturnType<typeof parseFillValueYaml>>) => FillValueClassification,
): DependentYamlItemAnalysis {
  if (!(fillValueYamlKey in params.item)) return emptyAnalysis()
  const parsed = parseFillValueItem(params.item)
  if (parsed === undefined) return unresolvedAnalysis(params, "не удалось разобрать значение заполнения")
  const classification = classify(params, parsed.value)
  const analysis = parsed.tagged
    ? classification.kind === "invalid"
      ? emptyAnalysis()
      : diagnosticAnalysis(params, "!xml допустим только для несовместимого XML-значения", "error")
    : analysisFromClassification(params, classification)
  return withValueReference(params, parsed.value, analysis)
}

export function parseFillValueItem(
  item: Readonly<Record<string, unknown>>
): { readonly tagged: boolean; readonly value: MetadataTypedValue } | undefined {
  const tagged = yamlScalarTagAt(item, fillValueYamlKey) === "xml"
  const rawValue = item[fillValueYamlKey]
  const value = parseFillValueYaml(
    tagged && typeof rawValue === "string" ? xmlScalarTagPayload(rawValue) : rawValue
  )
  return value === undefined ? undefined : { tagged, value }
}

export function classifyMetadataAttributeFillValue(
  params: DependentItemParams,
  value = parseFillValueItem(params.item)?.value
): FillValueClassification {
  if (value === undefined) return { kind: "unresolved", reason: "не удалось разобрать значение заполнения" }
  const type = importTypeDescriptionFromYAML(
    validationContext,
    undefined,
    params.item[typeYamlKey] as TypeDescriptionYAML | undefined
  )
  return classifyFillValue({ effectiveType: effectiveTypeFromTypeDescription(type), value })
}

export function classifyStandardAttributeFillValue(
  params: DependentItemParams,
  value = parseFillValueItem(params.item)?.value
): FillValueClassification {
  if (value === undefined) return { kind: "unresolved", reason: "не удалось разобрать значение заполнения" }
  if (params.itemName === undefined) return { kind: "unresolved", reason: "не определено имя стандартного реквизита" }
  const declaration = getStandardMembers(params.owner.dir).find((member) => member.names.yaml === params.itemName)
  if (declaration === undefined) return { kind: "notSpecified" }
  return classifyStandardMemberFillValue({ declaration, value, ownerProperties: ownerProperties(params) })
}

function withValueReference(
  params: DependentYamlItemParams,
  value: NonNullable<ReturnType<typeof parseFillValueYaml>>,
  analysis: DependentYamlItemAnalysis
): DependentYamlItemAnalysis {
  const constraint = inferFillValueReferenceConstraint(value)
  if (constraint === undefined) return analysis
  const reference = materializeMetadataValueReference({
    value,
    constraint,
    filePath: params.filePath,
    parsed: dependentParsedYaml(params.parsed),
    yamlPath: [...params.itemYamlPath, fillValueYamlKey],
  })
  return {
    diagnostics: [...analysis.diagnostics, ...reference.diagnostics],
    references: reference.references,
  }
}

export function inferFillValueReferenceConstraint(
  value: NonNullable<ReturnType<typeof parseFillValueYaml>>
): Extract<MetadataTargetConstraint, { kind: "value" }> | undefined {
  if (value.type !== "ref" || value.value === "") return undefined
  const root = value.value.split(".", 1)[0]
  if (root === undefined || !isMetadataRootName(root)) return undefined
  return {
    kind: "value",
    roots: [root],
    valueKinds: ["predefinedValue", "enumValue", "emptyRef"],
    allowEmptyRef: true,
  }
}

function analysisFromClassification(
  params: DependentYamlItemParams,
  classification: FillValueClassification
): DependentYamlItemAnalysis {
  switch (classification.kind) {
    case "valid":
    case "notSpecified":
      return emptyAnalysis()
    case "implicit":
      return diagnosticAnalysis(params, "поле содержит неявное значение; удалите ЗначениеЗаполнения", "error")
    case "invalid":
      return diagnosticAnalysis(params, classification.reason, "error")
    case "unresolved":
      return diagnosticAnalysis(params, classification.reason, "warning")
  }
}

function diagnosticAnalysis(
  params: DependentYamlItemParams,
  message: string,
  severity: "error" | "warning"
): DependentYamlItemAnalysis {
  return {
    diagnostics: [
      diagnosticAtYamlPath({
        filePath: params.filePath,
        parsed: dependentParsedYaml(params.parsed),
        path: [...params.itemYamlPath, fillValueYamlKey],
        source: "structure",
        severity,
        message,
      }),
    ],
    references: [],
  }
}

function unresolvedAnalysis(params: DependentYamlItemParams, message: string): DependentYamlItemAnalysis {
  return diagnosticAnalysis(params, message, "warning")
}

function emptyAnalysis(): DependentYamlItemAnalysis {
  return { diagnostics: [], references: [] }
}

export function parseFillValueYaml(value: unknown) {
  return importMetadataValueFromYAML(validationContext, undefined, value as MetadataValueYAML | undefined)
}

function ownerProperties(params: DependentItemParams): Record<string, unknown> {
  const root = asRecord(params.rootYaml)
  const result: Record<string, unknown> = {}
  for (const [modelKey, rule] of Object.entries(dependentRootRule(params.rootRule).properties)) {
    if (rule.yaml === undefined) continue
    const raw = root[rule.yaml]
    if (raw === undefined) continue
    result[modelKey] = modelKey === "owners" ? normalizeOwners(raw) : raw
  }
  return result
}

function dependentParsedYaml(parsed: unknown): ParsedYaml {
  return parsed as ParsedYaml
}

function dependentRootRule(rule: unknown): MetadataItemRule {
  return rule as MetadataItemRule
}

function normalizeOwners(value: unknown): unknown {
  if (!Array.isArray(value)) return value
  return value.map((item) => (typeof item === "string" ? normalizeOwner(item) : item))
}

function normalizeOwner(value: string): string {
  const constraint = { kind: "object", roots: ownerRoots } as const
  const model = parseMetadataTargetFromModel({ canonical: value, constraint })
  if (model.ok) return model.canonical
  const yaml = parseMetadataTargetFromYAML({ value, constraint })
  return yaml.ok ? yaml.canonical : value
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}
