import type { ConfigurationContext } from "../../context/types"
import type { MetadataItemRule, PropertyRule } from "../../ruleRuntime/property/types"
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
import {
  classifyStandardMemberFillValue,
  effectiveTypeFromTypeDescription,
  isReferenceStandardMember,
} from "./effectiveType"
import type { FillValueClassification } from "./types"
import { diagnosticAtYamlPath } from "../../validation/yamlLocations"
import { xmlScalarTagPayload, yamlScalarTagAt } from "../../../yaml/scalarTags"
import { asExplicitYAMLStringIfMarked } from "../../../yaml/explicitString"
import { fillValueDiagnostic } from "../../ruleRuntime/property/fillValueSemantics"
import { effectiveFillValueType } from "../../ruleRuntime/property/fillValueSemantics"

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
  if (!(fillValueYamlKey in params.item)) return emptyAnalysis()
  const parsed = parseFillValueItem(params.item)
  if (parsed === undefined) return unresolvedAnalysis(params, "не удалось разобрать значение заполнения")
  const type = metadataAttributeType(params.item)
  if (type?.type.some((sourceType) => sourceType.startsWith("DefinedType.")) === true) {
    return withValueReference(params, parsed.value, {
      diagnostics: [],
      references: [],
      projectChecks: [{
        kind: "fillValue",
        yamlPath: [...params.itemYamlPath, fillValueYamlKey],
        itemType: params.itemType,
        type,
        value: parsed.value,
        tagged: parsed.tagged,
        ...(parsed.transport === undefined ? {} : { transport: parsed.transport }),
      }],
    })
  }
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
  const diagnostic = parsed.transport === "DesignTimeRef"
    ? designTimeRefDiagnostic(params, classification)
    : fillValueDiagnostic(classification, parsed.tagged)
  const analysis = diagnostic === undefined
    ? emptyAnalysis()
    : diagnosticAnalysis(params, diagnostic.message, diagnostic.severity)
  return withValueReference(params, parsed.value, analysis)
}

export function parseFillValueItem(
  item: Readonly<Record<string, unknown>>
): { readonly tagged: boolean; readonly value: MetadataTypedValue; readonly transport?: "DesignTimeRef" } | undefined {
  const tagged = yamlScalarTagAt(item, fillValueYamlKey) === "xml"
  const rawValue = item[fillValueYamlKey]
  if (tagged && rawValue === "!xml DesignTimeRef") {
    return { tagged: true, value: { type: "ref", value: "" }, transport: "DesignTimeRef" }
  }
  const value = parseFillValueYaml(
    tagged && typeof rawValue === "string"
      ? xmlScalarTagPayload(rawValue)
      : asExplicitYAMLStringIfMarked(item, fillValueYamlKey, rawValue)
  )
  return value === undefined ? undefined : { tagged, value }
}

function designTimeRefDiagnostic(
  params: DependentYamlItemParams,
  fallback: FillValueClassification,
): { readonly message: string; readonly severity: "error" | "warning" } | undefined {
  if (params.itemType === "MetadataAttribute") {
    const effectiveType = effectiveFillValueType(metadataAttributeType(params.item), params.definedTypeLookup)
    if (effectiveType.status === "unresolved") return { message: effectiveType.reason, severity: "warning" }
    if (effectiveType.status === "known" && effectiveType.alternatives.some(({ kind }) => kind === "reference")) {
      return undefined
    }
    return { message: "DesignTimeRef допустим только для ссылочного типа", severity: "error" }
  }
  if (params.itemName !== undefined) {
    const declaration = getStandardMembers(params.owner.dir).find(({ names }) => names.yaml === params.itemName)
    const policy = declaration?.memberKind === "standardAttribute" ? declaration.fillValue?.policy : undefined
    if (
      policy === "forbidden" ||
      policy === "ownerReference" ||
      (declaration !== undefined && isReferenceStandardMember(declaration))
    ) {
      return undefined
    }
  }
  return fillValueDiagnostic(fallback, true)
}

export function classifyMetadataAttributeFillValue(
  params: DependentItemParams,
  value = parseFillValueItem(params.item)?.value
): FillValueClassification {
  if (value === undefined) return { kind: "unresolved", reason: "не удалось разобрать значение заполнения" }
  const type = metadataAttributeType(params.item)
  return classifyFillValue({
    effectiveType: params.definedTypeLookup === undefined
      ? effectiveTypeFromTypeDescription(type)
      : effectiveFillValueType(type, params.definedTypeLookup),
    value,
  })
}

export function metadataAttributeUsesDefinedType(item: Readonly<Record<string, unknown>>): boolean {
  return metadataAttributeType(item)?.type.some((sourceType) => sourceType.startsWith("DefinedType.")) === true
}

function metadataAttributeType(item: Readonly<Record<string, unknown>>) {
  return importTypeDescriptionFromYAML(
    validationContext,
    undefined,
    item[typeYamlKey] as TypeDescriptionYAML | undefined
  )
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
    projectChecks: analysis.projectChecks,
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
    projectChecks: [],
  }
}

function unresolvedAnalysis(params: DependentYamlItemParams, message: string): DependentYamlItemAnalysis {
  return diagnosticAnalysis(params, message, "warning")
}

function emptyAnalysis(): DependentYamlItemAnalysis {
  return { diagnostics: [], references: [], projectChecks: [] }
}

export function parseFillValueYaml(value: unknown) {
  return importMetadataValueFromYAML(validationContext, undefined, value as MetadataValueYAML | undefined)
}

function ownerProperties(params: DependentItemParams): Record<string, unknown> {
  const root = asRecord(params.rootYaml)
  const result: Record<string, unknown> = {}
  for (const [modelKey, rule] of Object.entries(dependentRootRule(params.rootRule).properties)) {
    const raw = effectiveOwnerPropertyValue(root, rule)
    if (raw === undefined) continue
    result[modelKey] = modelKey === "owners" ? normalizeOwners(raw) : raw
  }
  return result
}

function effectiveOwnerPropertyValue(root: Record<string, unknown>, rule: PropertyRule): unknown {
  if (typeof rule.yaml !== "string") return undefined
  if (Object.prototype.hasOwnProperty.call(root, rule.yaml)) return root[rule.yaml]
  return typeof rule.implicitValueYAML === "function" ? undefined : rule.implicitValueYAML
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
