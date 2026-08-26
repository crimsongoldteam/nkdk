import type { MetadataTypedValue } from "../metadataValue/types"
import type { TypeDescription } from "../typeDescription/types"
import type { StandardMemberDeclaration } from "../../standardMembers/declarations"
import { classifyFillValue } from "./classify"
import type { FillValueClassification } from "./types"
import type { FillValueAlternative, FillValueEffectiveType } from "./types"
import { effectiveFillValueType } from "./definedType"
import { isMetadataRootName } from "../metadataTargets/roots"

export function effectiveTypeFromTypeDescription(type: TypeDescription | undefined): FillValueEffectiveType {
  return effectiveFillValueType(type)
}

export function isReferenceStandardMember(declaration: StandardMemberDeclaration): boolean {
  if (declaration.memberKind !== "standardAttribute") return false
  return declaration.family === "sameOwnerObject" ||
    declaration.family === "objectRefsFromProperty" ||
    declaration.family === "objectRefFromProperty" ||
    declaration.family === "reverseLookup" ||
    declaration.family === "closedReverseLookup"
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
    case "stringFromOwner":
      return classifyStringFromOwner(params.value, params.ownerProperties, policy)
    case "ownerReference":
      return classifyOwnerReference(params.value, params.ownerProperties[policy.ownersProperty])
  }
}

export function implicitStandardMemberFillValue(params: {
  readonly declaration: StandardMemberDeclaration
  readonly ownerProperties: Readonly<Record<string, unknown>>
}): MetadataTypedValue | undefined {
  if (params.declaration.memberKind !== "standardAttribute") return undefined
  const policy = params.declaration.fillValue
  if (policy?.policy !== "ownerReference") return undefined
  const owners = params.ownerProperties[policy.ownersProperty]
  if (!Array.isArray(owners) || owners.length !== 1 || typeof owners[0] !== "string") return undefined
  const separator = owners[0].indexOf(".")
  if (separator < 1 || separator === owners[0].length - 1) return undefined
  const root = owners[0].slice(0, separator)
  if (!isMetadataRootName(root)) return undefined
  return { type: "ref", value: `${owners[0]}.EmptyRef` }
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
      return {
        status: "known",
        alternatives: [{ kind: "dateTime", dateFractions: "DateTime" }],
        composite: false,
      }
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

function classifyStringFromOwner(
  value: MetadataTypedValue,
  owner: Readonly<Record<string, unknown>>,
  policy: Extract<NonNullable<StandardMemberDeclaration["fillValue"]>, { policy: "stringFromOwner" }>,
): FillValueClassification {
  const length = owner[policy.lengthProperty]
  if (typeof length !== "number") {
    return { kind: "unresolved", reason: "не определена длина строки" }
  }
  return classifyFillValue({
    effectiveType: {
      status: "known",
      alternatives: [{ kind: "string", length, allowedLength: "Variable" }],
      composite: false,
    },
    value,
  })
}

function classifyOwnerReference(value: MetadataTypedValue, ownersValue: unknown): FillValueClassification {
  if (ownersValue === undefined || (Array.isArray(ownersValue) && ownersValue.length === 0)) {
    return {
      kind: "invalid",
      reason: "у справочника отсутствуют владельцы; значение заполнения реквизита Владелец допускается только с !xml",
    }
  }
  if (!Array.isArray(ownersValue)) {
    return { kind: "unresolved", reason: "не удалось определить владельцев справочника" }
  }

  const alternatives = ownersValue.flatMap((owner): FillValueAlternative[] => {
    if (typeof owner !== "string") return []
    const separator = owner.indexOf(".")
    const root = separator === -1 ? owner : owner.slice(0, separator)
    const objectName = separator === -1 ? undefined : owner.slice(separator + 1)
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
