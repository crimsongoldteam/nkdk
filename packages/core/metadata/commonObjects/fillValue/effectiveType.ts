import type { MetadataRootName } from "../metadataTargets/types"
import type { TypeDescription } from "../typeDescription/types"
import type { FillValueAlternative, FillValueEffectiveType } from "./types"

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

export function effectiveTypeFromTypeDescription(type: TypeDescription | undefined): FillValueEffectiveType {
  if (type === undefined || type.type.length === 0) {
    return { status: "unresolved", reason: "эффективный тип реквизита не определён" }
  }

  const alternatives: FillValueAlternative[] = []
  for (const sourceType of type.type) {
    const alternative = alternativeFromType(sourceType, type)
    if (alternative === undefined) {
      return { status: "unresolved", reason: `проверка значения для типа ${sourceType} не поддержана` }
    }
    alternatives.push(alternative)
  }

  return { status: "known", alternatives, composite: alternatives.length > 1 }
}

function alternativeFromType(sourceType: string, type: TypeDescription): FillValueAlternative | undefined {
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
    ...(objectName !== undefined ? { objectName } : {}),
  }
}

function splitType(value: string): [base: string, objectName?: string] {
  const separator = value.indexOf(".")
  return separator === -1 ? [value] : [value.slice(0, separator), value.slice(separator + 1)]
}
