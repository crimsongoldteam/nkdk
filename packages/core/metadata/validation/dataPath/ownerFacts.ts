import type { TypeDescription } from "../../commonObjects/typeDescription/types"
import type { MetadataItem } from "../../orchestration/property/types"
import type { ObjectFieldIndex } from "./objectFields"
import type { OwnerTypeRef } from "./types"

export interface ValidationOwnerFacts {
  ref: OwnerTypeRef
  filePath: string
  fieldIndex: ObjectFieldIndex
  type?: TypeDescription
  commonAttributeOwnerLinks?: string[]
}

export function createValidationOwnerFacts(params: {
  ref: OwnerTypeRef
  filePath: string
  fieldIndex: ObjectFieldIndex
  model: MetadataItem
}): ValidationOwnerFacts {
  const type = metadataRecord(params.model)["type"]
  const commonAttributeOwnerLinks = commonAttributeOwnerLinksFromModel(params.model)

  return {
    ref: params.ref,
    filePath: params.filePath,
    fieldIndex: params.fieldIndex,
    ...(isTypeDescription(type) ? { type } : {}),
    ...(commonAttributeOwnerLinks.length === 0 ? {} : { commonAttributeOwnerLinks }),
  }
}

export function modelStubFromOwnerFacts(facts: ValidationOwnerFacts): unknown {
  return {
    ...(facts.type === undefined ? {} : { type: facts.type }),
    ...(facts.commonAttributeOwnerLinks === undefined
      ? {}
      : { content: facts.commonAttributeOwnerLinks.map((metadata) => ({ metadata, use: "Use" })) }),
  }
}

function commonAttributeOwnerLinksFromModel(model: MetadataItem): string[] {
  const content = metadataRecord(model)["content"]
  if (!Array.isArray(content)) return []

  return content
    .map((item) => {
      const record = metadataRecord(item)
      return record["use"] === "Use" && typeof record["metadata"] === "string" ? record["metadata"] : undefined
    })
    .filter((value): value is string => value !== undefined)
}

function isTypeDescription(value: unknown): value is TypeDescription {
  return typeof value === "object" && value !== null && "type" in value
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}
}
