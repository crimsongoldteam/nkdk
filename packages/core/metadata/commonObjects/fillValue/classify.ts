import { parseMetadataTargetFromModel } from "../metadataTargets"
import type { MetadataTypedValue } from "../metadataValue/types"
import type { FillValueAlternative, FillValueClassification, FillValueEffectiveType } from "./types"

export function classifyFillValue(params: {
  readonly effectiveType: FillValueEffectiveType
  readonly value: MetadataTypedValue
}): FillValueClassification {
  if (params.effectiveType.status === "notSpecified") return { kind: "notSpecified" }
  if (params.effectiveType.status === "unresolved") {
    return { kind: "unresolved", reason: params.effectiveType.reason }
  }

  const { alternatives, composite } = params.effectiveType
  if (!composite && isImplicit(params.value, alternatives[0])) return { kind: "implicit" }
  if (composite && params.value.type === "ref" && params.value.value === "") return { kind: "valid" }

  const valid = alternatives.some((alternative) => matchesAlternative(params.value, alternative))
  if (!valid) return { kind: "invalid", reason: "значение не соответствует эффективному типу реквизита" }

  return { kind: "valid" }
}

function isImplicit(value: MetadataTypedValue, alternative: FillValueAlternative | undefined): boolean {
  if (alternative === undefined) return false
  switch (alternative.kind) {
    case "string":
      return value.type === "string" && value.value === ""
    case "number":
      return value.type === "decimal" && value.value === 0
    case "boolean":
      return value.type === "boolean" && value.value === false
    case "reference":
      return value.type === "ref" && (value.value === "" || isMatchingEmptyRef(value.value, alternative))
  }
}

function matchesAlternative(value: MetadataTypedValue, alternative: FillValueAlternative): boolean {
  switch (alternative.kind) {
    case "string":
      return value.type === "string" && matchesStringLength(value.value, alternative)
    case "number":
      return value.type === "decimal" && matchesNumber(value.value, alternative)
    case "boolean":
      return value.type === "boolean"
    case "reference":
      return value.type === "ref" && matchesReference(value.value, alternative)
  }
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
  return (
    parsed.ok &&
    parsed.target.kind === "value" &&
    parsed.target.valueKind === "emptyRef" &&
    (type.objectName === undefined || parsed.target.objectName === type.objectName)
  )
}
