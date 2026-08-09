import type { MetadataRootName } from "../metadataTargets/types"
import type { MetadataTypedValue } from "../metadataValue/types"
import type { TypeDescription } from "../typeDescription/types"
import type { StandardMemberDeclaration } from "../../standardMembers/declarations"
import { classifyFillValue } from "./classify"
import type { FillValueClassification } from "./types"
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
    ...(objectName !== undefined ? { objectName } : {}),
  }
}

function splitType(value: string): [base: string, objectName?: string] {
  const separator = value.indexOf(".")
  return separator === -1 ? [value] : [value.slice(0, separator), value.slice(separator + 1)]
}

export function classifyStandardMemberFillValue(params: {
  readonly declaration: StandardMemberDeclaration
  readonly value: MetadataTypedValue
  readonly ownerProperties: Readonly<Record<string, unknown>>
}): FillValueClassification {
  if (params.declaration.memberKind !== "standardAttribute") return { kind: "notSpecified" }
  const policy = params.declaration.fillValue ?? { policy: "notSpecified" as const }

  switch (policy.policy) {
    case "notSpecified":
      return { kind: "notSpecified" }
    case "forbidden":
      return { kind: "invalid", reason: `для стандартного реквизита ${params.declaration.names.yaml} значение заполнения запрещено` }
    case "byEffectiveType":
      return classifyFillValue({ effectiveType: effectiveTypeFromDeclaration(params.declaration), value: params.value })
    case "codeFromOwner":
      return classifyCode(params.value, params.ownerProperties, policy)
    case "ownerReference":
      return classifyOwnerReference(params.value, params.ownerProperties[policy.ownersProperty])
  }
}

function effectiveTypeFromDeclaration(declaration: StandardMemberDeclaration): FillValueEffectiveType {
  if (declaration.memberKind !== "standardAttribute" || declaration.family !== "primitive") {
    return { status: "unresolved", reason: "тип стандартного реквизита не определён декларацией" }
  }
  switch (declaration.kind) {
    case "string":
      return { status: "known", alternatives: [{ kind: "string" }], composite: false }
    case "number":
      return { status: "known", alternatives: [{ kind: "number" }], composite: false }
    case "boolean":
      return { status: "known", alternatives: [{ kind: "boolean" }], composite: false }
    case "dateTime":
      return { status: "unresolved", reason: "проверка значения даты стандартного реквизита не поддержана" }
  }
}

function classifyCode(
  value: MetadataTypedValue,
  owner: Readonly<Record<string, unknown>>,
  policy: Extract<NonNullable<StandardMemberDeclaration["fillValue"]>, { policy: "codeFromOwner" }>
): FillValueClassification {
  const type = owner[policy.typeProperty]
  const length = owner[policy.lengthProperty]
  const allowedLength = owner[policy.allowedLengthProperty]
  if (typeof length !== "number") return { kind: "unresolved", reason: "не определена длина кода" }

  if ((type === "String" || type === "Строка") && value.type === "string" && /^\s+$/.test(value.value)) {
    return { kind: "implicit" }
  }

  if (type === "String" || type === "Строка") {
    return classifyFillValue({
      effectiveType: {
        status: "known",
        alternatives: [
          {
            kind: "string",
            length,
            allowedLength: allowedLength === "Fixed" || allowedLength === "Фиксированная" ? "Fixed" : "Variable",
          },
        ],
        composite: false,
      },
      value,
    })
  }

  if (type === "Number" || type === "Число") {
    return classifyFillValue({
      effectiveType: {
        status: "known",
        alternatives: [{ kind: "number", digits: length, fractionDigits: 0, allowedSign: "Nonnegative" }],
        composite: false,
      },
      value,
    })
  }

  return { kind: "unresolved", reason: "не определён тип кода" }
}

function classifyOwnerReference(value: MetadataTypedValue, ownersValue: unknown): FillValueClassification {
  if (!Array.isArray(ownersValue) || ownersValue.length === 0) {
    return { kind: "unresolved", reason: "не определены владельцы справочника" }
  }

  const alternatives = ownersValue.flatMap((owner): FillValueAlternative[] => {
    if (typeof owner !== "string") return []
    const [root, objectName] = splitType(owner)
    if (!isMetadataRootName(root) || objectName === undefined) return []
    return [
      {
        kind: "reference",
        constraint: {
          kind: "value",
          roots: [root],
          valueKinds: ["predefinedValue", "emptyRef"],
          allowEmptyRef: true,
        },
        objectName,
      },
    ]
  })
  if (alternatives.length !== ownersValue.length) {
    return { kind: "unresolved", reason: "не удалось определить тип одного из владельцев" }
  }
  return classifyFillValue({
    effectiveType: { status: "known", alternatives, composite: alternatives.length > 1 },
    value,
  })
}

function isMetadataRootName(value: string): value is MetadataRootName {
  return Object.values(referenceRootByType).includes(value as MetadataRootName)
}
