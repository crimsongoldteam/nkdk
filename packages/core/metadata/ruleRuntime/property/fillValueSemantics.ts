import { parseMetadataTargetFromModel } from "../metadataTarget"
import type { MetadataRootName, MetadataTargetConstraint } from "../metadataTarget/types"
import type { TypeDescriptionView } from "./typeDescriptionView"

export interface FillValueTypedValue {
  readonly type: string
  readonly value?: unknown
}

export type FillValueTransport = "DesignTimeRef"

export type FillValueAlternative =
  | { readonly kind: "string"; readonly length?: number; readonly allowedLength?: "Variable" | "Fixed" }
  | { readonly kind: "number"; readonly digits?: number; readonly fractionDigits?: number; readonly allowedSign?: "Any" | "Nonnegative" }
  | { readonly kind: "boolean" }
  | { readonly kind: "dateTime"; readonly dateFractions: "Date" | "Time" | "DateTime" }
  | { readonly kind: "reference"; readonly constraint: Extract<MetadataTargetConstraint, { kind: "value" }>; readonly objectName?: string }

export type FillValueEffectiveType =
  | { readonly status: "known"; readonly alternatives: readonly FillValueAlternative[]; readonly composite: boolean }
  | { readonly status: "unresolved"; readonly reason: string }
  | { readonly status: "notSpecified" }

export type FillValueClassification =
  | { readonly kind: "valid" }
  | { readonly kind: "implicit" }
  | { readonly kind: "invalid"; readonly reason: string }
  | { readonly kind: "unresolved"; readonly reason: string }
  | { readonly kind: "notSpecified" }

export type DefinedTypeLookup = (name: string) =>
  | { readonly status: "ok"; readonly type?: TypeDescriptionView }
  | { readonly status: "unresolved"; readonly reason: string }

const referenceRootByType: Readonly<Record<string, MetadataRootName | undefined>> = {
  CatalogRef: "Catalog",
  DocumentRef: "Document",
  EnumRef: "Enum",
  ChartOfAccountsRef: "ChartOfAccounts",
  ChartOfCharacteristicTypesRef: "ChartOfCharacteristicTypes",
  ChartOfCalculationTypesRef: "ChartOfCalculationTypes",
  ExchangePlanRef: "ExchangePlan",
  BusinessProcessRef: "BusinessProcess",
  BusinessProcessRoutePointRef: "BusinessProcessRoutePoint",
  TaskRef: "Task",
}

export function effectiveFillValueType(type: TypeDescriptionView | undefined, lookup?: DefinedTypeLookup): FillValueEffectiveType {
  if (type?.type === undefined || type.type.length === 0) {
    return { status: "unresolved", reason: "эффективный тип реквизита не определён" }
  }
  const resolved = resolveAlternatives(type, lookup, [])
  if (resolved.status === "unresolved") return resolved
  const alternatives = deduplicateAlternatives(resolved.alternatives)
  return { status: "known", alternatives, composite: alternatives.length > 1 }
}

type AlternativesResult =
  | { readonly status: "ok"; readonly alternatives: readonly FillValueAlternative[] }
  | Extract<FillValueEffectiveType, { status: "unresolved" }>

function resolveAlternatives(type: TypeDescriptionView, lookup: DefinedTypeLookup | undefined, stack: readonly string[]): AlternativesResult {
  const alternatives: FillValueAlternative[] = []
  for (const sourceType of type.type ?? []) {
    const definedTypeName = definedTypeNameFromSource(sourceType)
    if (definedTypeName !== undefined) {
      if (stack.includes(definedTypeName)) {
        return { status: "unresolved", reason: `цикл определяемых типов: ${[...stack, definedTypeName].join(" -> ")}` }
      }
      if (lookup === undefined) {
        return { status: "unresolved", reason: `проверка значения для типа ${sourceType} не поддержана` }
      }
      const found = lookup(definedTypeName)
      if (found.status === "unresolved") return found
      if (found.type?.type === undefined || found.type.type.length === 0) {
        return { status: "unresolved", reason: `у определяемого типа ${definedTypeName} не задан Тип` }
      }
      const nested = resolveAlternatives(found.type, lookup, [...stack, definedTypeName])
      if (nested.status === "unresolved") return nested
      alternatives.push(...nested.alternatives)
      continue
    }
    const alternative = directAlternative(sourceType, type)
    if (alternative === undefined) {
      return { status: "unresolved", reason: `проверка значения для типа ${sourceType} не поддержана` }
    }
    alternatives.push(alternative)
  }
  return { status: "ok", alternatives }
}

function definedTypeNameFromSource(sourceType: string): string | undefined {
  const [baseType, name] = splitType(sourceType)
  return baseType === "DefinedType" && name !== undefined ? name : undefined
}

function directAlternative(sourceType: string, type: TypeDescriptionView): FillValueAlternative | undefined {
  switch (sourceType) {
    case "string": return { kind: "string", ...type.stringQualifiers }
    case "decimal": return { kind: "number", ...type.numberQualifiers }
    case "boolean": return { kind: "boolean" }
    case "dateTime": return { kind: "dateTime", dateFractions: type.dateQualifiers?.dateFractions ?? "DateTime" }
  }
  const [baseType, objectName] = splitType(sourceType)
  const root = referenceRootByType[baseType]
  if (root === undefined) return undefined
  return {
    kind: "reference",
    constraint: { kind: "value", roots: [root], valueKinds: ["predefinedValue", "enumValue", "emptyRef"], allowEmptyRef: true },
    ...(objectName === undefined ? {} : { objectName }),
  }
}

function deduplicateAlternatives(alternatives: readonly FillValueAlternative[]): FillValueAlternative[] {
  const seen = new Set<string>()
  return alternatives.filter((alternative) => {
    const key = JSON.stringify(alternative)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function splitType(value: string): [base: string, objectName?: string] {
  const separator = value.indexOf(".")
  return separator === -1 ? [value] : [value.slice(0, separator), value.slice(separator + 1)]
}

export function classifyFillValue(params: { readonly effectiveType: FillValueEffectiveType; readonly value: FillValueTypedValue }): FillValueClassification {
  if (params.effectiveType.status === "notSpecified") return { kind: "notSpecified" }
  if (params.effectiveType.status === "unresolved") return { kind: "unresolved", reason: params.effectiveType.reason }
  const { alternatives, composite } = params.effectiveType
  if (!composite && isImplicit(params.value, alternatives[0])) return { kind: "implicit" }
  if (composite && params.value.type === "ref" && params.value.value === "") return { kind: "valid" }
  return alternatives.some((alternative) => matchesAlternative(params.value, alternative))
    ? { kind: "valid" }
    : { kind: "invalid", reason: "значение не соответствует эффективному типу реквизита" }
}

function isImplicit(value: FillValueTypedValue, alternative: FillValueAlternative | undefined): boolean {
  if (alternative === undefined) return false
  if (alternative.kind === "string") return value.type === "string" && value.value === ""
  if (alternative.kind === "number") return value.type === "decimal" && value.value === 0
  if (alternative.kind === "boolean") return value.type === "boolean" && value.value === false
  if (alternative.kind === "dateTime") return value.type === "dateTime" && value.value === "0001-01-01T00:00:00"
  return value.type === "ref" && typeof value.value === "string" && (value.value === "" || isMatchingEmptyRef(value.value, alternative))
}

function matchesAlternative(value: FillValueTypedValue, alternative: FillValueAlternative): boolean {
  if (alternative.kind === "string") return value.type === "string" && typeof value.value === "string" && matchesStringLength(value.value, alternative)
  if (alternative.kind === "number") return value.type === "decimal" && typeof value.value === "number" && matchesNumber(value.value, alternative)
  if (alternative.kind === "boolean") return value.type === "boolean" && typeof value.value === "boolean"
  if (alternative.kind === "dateTime") return value.type === "dateTime" && typeof value.value === "string" && matchesDateTime(value.value, alternative.dateFractions)
  return value.type === "ref" && typeof value.value === "string" && matchesReference(value.value, alternative)
}

const canonicalDateTime = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/

function matchesDateTime(value: string, fractions: "Date" | "Time" | "DateTime"): boolean {
  const match = canonicalDateTime.exec(value)
  if (match === null) return false
  const [, yearText, monthText, dayText, hourText, minuteText, secondText] = match
  const year = Number(yearText); const month = Number(monthText); const day = Number(dayText)
  const hour = Number(hourText); const minute = Number(minuteText); const second = Number(secondText)
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return false
  if (hour > 23 || minute > 59 || second > 59) return false
  if (fractions === "Date") return hour === 0 && minute === 0 && second === 0
  if (fractions === "Time") return year === 1 && month === 1 && day === 1
  return true
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28
  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

function matchesStringLength(value: string, type: Extract<FillValueAlternative, { kind: "string" }>): boolean {
  if (type.length === undefined || type.length === 0) return true
  return type.allowedLength === "Fixed" ? value.length === type.length : value.length <= type.length
}

function matchesNumber(value: number, type: Extract<FillValueAlternative, { kind: "number" }>): boolean {
  if (type.allowedSign === "Nonnegative" && value < 0) return false
  const [integer, fraction = ""] = String(Math.abs(value)).split(".")
  if (type.fractionDigits !== undefined && fraction.length > type.fractionDigits) return false
  return type.digits === undefined || integer.length + fraction.length <= type.digits
}

function matchesReference(value: string, type: Extract<FillValueAlternative, { kind: "reference" }>): boolean {
  if (value === "") return false
  const parsed = parseMetadataTargetFromModel({ canonical: value, constraint: type.constraint })
  return parsed.ok && (type.objectName === undefined || parsed.target.objectName === type.objectName)
}

function isMatchingEmptyRef(value: string, type: Extract<FillValueAlternative, { kind: "reference" }>): boolean {
  const parsed = parseMetadataTargetFromModel({ canonical: value, constraint: type.constraint })
  return parsed.ok && parsed.target.kind === "value" && parsed.target.valueKind === "emptyRef" &&
    (type.objectName === undefined || parsed.target.objectName === type.objectName)
}

export function fillValueDiagnostic(classification: FillValueClassification, tagged: boolean): { readonly message: string; readonly severity: "error" | "warning" } | undefined {
  if (tagged) return classification.kind === "invalid" ? undefined : { message: "!xml допустим только для несовместимого XML-значения", severity: "error" }
  if (classification.kind === "valid" || classification.kind === "notSpecified") return undefined
  if (classification.kind === "implicit") return { message: "поле содержит неявное значение; удалите ЗначениеЗаполнения", severity: "error" }
  if (classification.kind === "invalid") return { message: classification.reason, severity: "error" }
  return { message: classification.reason, severity: "warning" }
}
