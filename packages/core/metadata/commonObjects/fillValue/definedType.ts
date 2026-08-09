import type { TypeDescriptionView } from "../../ruleRuntime/property/typeDescriptionView"
import type { MetadataRootName } from "../metadataTargets/types"
import type {
  DefinedTypeLookup,
  FillValueAlternative,
  FillValueEffectiveType,
} from "./types"

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

export function effectiveFillValueType(
  type: TypeDescriptionView | undefined,
  lookup?: DefinedTypeLookup,
): FillValueEffectiveType {
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

function resolveAlternatives(
  type: TypeDescriptionView,
  lookup: DefinedTypeLookup | undefined,
  stack: readonly string[],
): AlternativesResult {
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
    case "string":
      return {
        kind: "string",
        ...(type.stringQualifiers?.length !== undefined ? { length: type.stringQualifiers.length } : {}),
        ...(type.stringQualifiers?.allowedLength !== undefined
          ? { allowedLength: type.stringQualifiers.allowedLength }
          : {}),
      }
    case "decimal":
      return {
        kind: "number",
        ...(type.numberQualifiers?.digits !== undefined ? { digits: type.numberQualifiers.digits } : {}),
        ...(type.numberQualifiers?.fractionDigits !== undefined
          ? { fractionDigits: type.numberQualifiers.fractionDigits }
          : {}),
        ...(type.numberQualifiers?.allowedSign !== undefined
          ? { allowedSign: type.numberQualifiers.allowedSign }
          : {}),
      }
    case "boolean":
      return { kind: "boolean" }
    case "dateTime":
      return { kind: "dateTime", dateFractions: type.dateQualifiers?.dateFractions ?? "DateTime" }
  }

  const [baseType, objectName] = splitType(sourceType)
  const root = referenceRootByType[baseType]
  if (root === undefined) return undefined
  return {
    kind: "reference",
    constraint: {
      kind: "value",
      roots: [root],
      valueKinds: ["predefinedValue", "enumValue", "emptyRef"],
      allowEmptyRef: true,
    },
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
