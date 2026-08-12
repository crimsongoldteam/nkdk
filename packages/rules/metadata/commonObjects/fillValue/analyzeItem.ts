import type { ConfigurationContext } from "@nkdk/runtime"
import type { MetadataItemRule, PropertyRule } from "@nkdk/runtime/rule-kit"
import type { ParsedYaml } from "@nkdk/runtime"
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
import type { FillValueClassification, FillValueTransport } from "./types"
import { diagnosticAtYamlPath } from "../../validation/yamlLocations"
import { xmlScalarTagPayload, yamlScalarTagAt } from "@nkdk/runtime"
import { asExplicitYAMLStringIfMarked } from "@nkdk/runtime"
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
  const transport = analyzeTransport(params, parsed.transport, metadataAttributeTransportDiagnostic)
  if (transport !== undefined) return transport
  const type = metadataAttributeType(params.item)
  if (type?.type.some((sourceType) => sourceType.startsWith("DefinedType.")) === true) {
    if (parsed.tagged && parsed.value.type === "ref") {
      return withValueReference(params, parsed.value, emptyAnalysis(), parsed.tagged)
    }
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
        ...(parsed.transport === "DesignTimeRef" ? { transport: parsed.transport } : {}),
      }],
    }, parsed.tagged)
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
  const transport = analyzeTransport(params, parsed.transport, standardAttributeTransportDiagnostic)
  if (transport !== undefined) return transport
  if (parsed.tagged && parsed.value.type === "ref") {
    return withValueReference(params, parsed.value, emptyAnalysis(), parsed.tagged)
  }
  const classification = classify(params, parsed.value)
  const diagnostic = parsed.transport === "DesignTimeRef"
    ? designTimeRefDiagnostic(params, classification)
    : fillValueDiagnostic(classification, parsed.tagged)
  const analysis = diagnostic === undefined
    ? emptyAnalysis()
    : diagnosticAnalysis(params, diagnostic.message, diagnostic.severity)
  return withValueReference(params, parsed.value, analysis, parsed.tagged)
}

function analyzeTransport(
  params: DependentYamlItemParams,
  transport: FillValueTransport | undefined,
  diagnose: (
    params: DependentYamlItemParams,
    transport: Exclude<FillValueTransport, "DesignTimeRef">,
  ) => { readonly message: string; readonly severity: "error" | "warning" } | undefined,
): DependentYamlItemAnalysis | undefined {
  if (transport === undefined || transport === "DesignTimeRef") return undefined
  const diagnostic = diagnose(params, transport)
  return diagnostic === undefined
    ? emptyAnalysis()
    : diagnosticAnalysis(params, diagnostic.message, diagnostic.severity)
}

export function parseFillValueItem(
  item: Readonly<Record<string, unknown>>
): { readonly tagged: boolean; readonly value: MetadataTypedValue; readonly transport?: FillValueTransport } | undefined {
  const tagged = yamlScalarTagAt(item, fillValueYamlKey) === "xml"
  const rawValue = item[fillValueYamlKey]
  const payload = tagged && typeof rawValue === "string" ? xmlScalarTagPayload(rawValue) : undefined
  if (payload !== undefined && isFillValueTransport(payload)) {
    return {
      tagged: true,
      value: payload === "DesignTimeRef"
        ? { type: "ref", value: "" }
        : { type: "string", value: "" },
      transport: payload,
    }
  }
  const value = parseFillValueYaml(
    payload !== undefined
      ? payload
      : asExplicitYAMLStringIfMarked(item, fillValueYamlKey, rawValue)
  )
  return value === undefined ? undefined : { tagged, value }
}

function isFillValueTransport(value: string): value is FillValueTransport {
  return value === "Nil" ||
    value === "String" ||
    value === "DesignTimeRef" ||
    value === "TypeDescription" ||
    value === "Null"
}

function metadataAttributeTransportDiagnostic(
  params: DependentYamlItemParams,
  transport: Exclude<FillValueTransport, "DesignTimeRef">,
): { readonly message: string; readonly severity: "error" | "warning" } | undefined {
  if (transport === "Null") {
    return params.itemType === "MetadataExternalDataSourceField"
      ? undefined
      : { message: "Null допустим только для поля внешнего источника данных", severity: "error" }
  }
  if (transport !== "Nil") {
    return { message: `${transport} недопустим для обычного реквизита`, severity: "error" }
  }
  const effectiveType = effectiveFillValueType(metadataAttributeType(params.item), params.definedTypeLookup)
  if (effectiveType.status === "unresolved") return { message: effectiveType.reason, severity: "warning" }
  if (effectiveType.status !== "known") {
    return { message: "не удалось определить тип реквизита", severity: "warning" }
  }
  const singleString = !effectiveType.composite &&
    effectiveType.alternatives.length === 1 &&
    effectiveType.alternatives[0]?.kind === "string"
  return singleString
    ? undefined
    : { message: "Nil допустим только для обычного строкового реквизита", severity: "error" }
}

function standardAttributeTransportDiagnostic(
  params: DependentYamlItemParams,
  transport: Exclude<FillValueTransport, "DesignTimeRef">,
): { readonly message: string; readonly severity: "error" } | undefined {
  const declaration = params.itemName === undefined
    ? undefined
    : getStandardMembers(params.owner.dir).find(({ names }) => names.yaml === params.itemName)
  if (transport === "TypeDescription") {
    return declaration?.memberKind === "standardAttribute" && declaration.family === "typeDescription"
      ? undefined
      : { message: "TypeDescription допустим только для стандартного реквизита ТипЗначения", severity: "error" }
  }
  if (transport === "String") {
    return standardMemberUsesString(declaration, ownerProperties(params))
      ? undefined
      : { message: "String допустим только для строкового стандартного реквизита", severity: "error" }
  }
  return { message: `${transport} недопустим для стандартного реквизита`, severity: "error" }
}

function standardMemberUsesString(
  declaration: ReturnType<typeof getStandardMembers>[number] | undefined,
  owner: Readonly<Record<string, unknown>>,
): boolean {
  if (declaration?.memberKind !== "standardAttribute") return false
  if (declaration.family === "primitive") return declaration.kind === "string"
  if (declaration.family === "codeByProperty") {
    return owner[declaration.property] === "String" || owner[declaration.property] === "Строка"
  }
  if (declaration.family === "numberByProperty") {
    return owner[declaration.property] === "String" || owner[declaration.property] === "Строка"
  }
  return false
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
  analysis: DependentYamlItemAnalysis,
  tagged: boolean,
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
    references: reference.references.map((candidate) => ({
      ...candidate,
      ...(tagged ? { tagged: "xml" as const } : {}),
    })),
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
