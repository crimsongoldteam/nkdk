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
  owners?: string[]
  task?: string
  registerRecords?: string[]
  chartOfAccounts?: string
  extDimensionTypes?: string
  accountingFlags?: NamedTypeItems
  extDimensionAccountingFlags?: NamedTypeItems
}

type ValidationOwnerFactsModel = MetadataItem & {
  type?: unknown
  content?: unknown
  owners?: unknown
  task?: unknown
  registerRecords?: unknown
  chartOfAccounts?: unknown
  extDimensionTypes?: unknown
  accountingFlags?: unknown
  extDimensionAccountingFlags?: unknown
}

type NamedTypeItems = Array<{ name: string; type?: TypeDescription }>

export function createValidationOwnerFacts(params: {
  ref: OwnerTypeRef
  filePath: string
  fieldIndex: ObjectFieldIndex
  model: ValidationOwnerFactsModel
}): ValidationOwnerFacts {
  const type = metadataRecord(params.model)["type"]
  const commonAttributeOwnerLinks = commonAttributeOwnerLinksFromModel(params.model)
  const owners = stringArray(metadataRecord(params.model)["owners"])
  const task = metadataRecord(params.model)["task"]
  const registerRecords = stringArray(metadataRecord(params.model)["registerRecords"])
  const chartOfAccounts = metadataRecord(params.model)["chartOfAccounts"]
  const extDimensionTypes = metadataRecord(params.model)["extDimensionTypes"]
  const accountingFlags = namedTypeItems(metadataRecord(params.model)["accountingFlags"])
  const extDimensionAccountingFlags = namedTypeItems(metadataRecord(params.model)["extDimensionAccountingFlags"])

  return {
    ref: params.ref,
    filePath: params.filePath,
    fieldIndex: params.fieldIndex,
    ...(isTypeDescription(type) ? { type } : {}),
    ...(commonAttributeOwnerLinks.length === 0 ? {} : { commonAttributeOwnerLinks }),
    ...(owners.length === 0 ? {} : { owners }),
    ...(typeof task === "string" ? { task } : {}),
    ...(registerRecords.length === 0 ? {} : { registerRecords }),
    ...(typeof chartOfAccounts === "string" ? { chartOfAccounts } : {}),
    ...(typeof extDimensionTypes === "string" ? { extDimensionTypes } : {}),
    ...(accountingFlags.length === 0 ? {} : { accountingFlags }),
    ...(extDimensionAccountingFlags.length === 0 ? {} : { extDimensionAccountingFlags }),
  }
}

export function modelStubFromOwnerFacts(facts: ValidationOwnerFacts): unknown {
  return {
    ...(facts.type === undefined ? {} : { type: facts.type }),
    ...(facts.commonAttributeOwnerLinks === undefined
      ? {}
      : { content: facts.commonAttributeOwnerLinks.map((metadata) => ({ metadata, use: "Use" })) }),
    ...(facts.owners === undefined ? {} : { owners: facts.owners }),
    ...(facts.task === undefined ? {} : { task: facts.task }),
    ...(facts.registerRecords === undefined ? {} : { registerRecords: facts.registerRecords }),
    ...(facts.chartOfAccounts === undefined ? {} : { chartOfAccounts: facts.chartOfAccounts }),
    ...(facts.extDimensionTypes === undefined ? {} : { extDimensionTypes: facts.extDimensionTypes }),
    ...(facts.accountingFlags === undefined ? {} : { accountingFlags: facts.accountingFlags }),
    ...(facts.extDimensionAccountingFlags === undefined
      ? {}
      : { extDimensionAccountingFlags: facts.extDimensionAccountingFlags }),
  }
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

function namedTypeItems(value: unknown): NamedTypeItems {
  if (!Array.isArray(value)) return []

  return value.flatMap((item) => {
    const record = metadataRecord(item)
    if (typeof record["name"] !== "string") return []
    const type = record["type"]
    return [
      {
        name: record["name"],
        ...(isTypeDescription(type) ? { type } : {}),
      },
    ]
  })
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
