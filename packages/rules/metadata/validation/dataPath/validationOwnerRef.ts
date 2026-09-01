import type { ParsedMetadataTarget } from "@nkdk/runtime/rule-kit"
import { getDataPathOwnerKindByItemType } from "./ownerKindRegistry"
import type { OwnerTypeRef } from "./types"

export function validationOwnerRef(params: {
  readonly fallback: OwnerTypeRef
  readonly itemType: string
  readonly objectTarget?: ParsedMetadataTarget
}): OwnerTypeRef {
  const registration = getDataPathOwnerKindByItemType(params.itemType)
  if (registration === undefined) return params.fallback
  if (params.objectTarget?.kind !== "object") {
    return { kind: registration.kind, ...(params.fallback.name === undefined ? {} : { name: params.fallback.name }) }
  }
  const name = [
    params.objectTarget.objectName,
    ...(params.objectTarget.segments ?? []).map(({ objectName }) => objectName),
  ].join(".")
  return { kind: registration.kind, ...(name.length === 0 ? {} : { name }) }
}

export function sameValidationOwnerRef(left: OwnerTypeRef, right: OwnerTypeRef): boolean {
  return left.kind === right.kind && left.name === right.name
}
