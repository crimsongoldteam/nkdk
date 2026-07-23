import type { TypeDescription } from "../../commonObjects/typeDescription/types"
import type { MetadataItem } from "../../orchestration/property/types"
import type { ObjectFieldIndex } from "./objectFields"
import type { OwnerTypeRef } from "./types"
import type { CollectLocalFactsFromYAMLFunction } from "../../orchestration/property/importYamlTypes"
import type { OwnerFactRole } from "../../orchestration/property/types"
import { rootFromYAML } from "../../commonObjects/metadataTargets/roots"
import { CommonAttributeUseFromYAML, type CommonAttributeUseYAML } from "../../systemEnumerations/types"
import { typeDescriptionFromYAML } from "./formYamlIndex"

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
  registerType?: string
  attributes?: NamedTypeItems
  dimensions?: NamedTypeItems
  resources?: NamedTypeItems
  addressingAttributes?: NamedTypeItems
  tabularSections?: Array<{ name: string; attributes: NamedTypeItems; standardAttributes?: NamedTypeItems }>
  standardAttributes?: NamedTypeItems
  commands?: NamedTypeItems
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
  attributes?: unknown
  dimensions?: unknown
  resources?: unknown
  addressingAttributes?: unknown
  tabularSections?: unknown
  standardAttributes?: unknown
  registerType?: unknown
  commands?: unknown
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
  const registerType = metadataRecord(params.model)["registerType"]
  const attributes = namedTypeItems(metadataRecord(params.model)["attributes"])
  const dimensions = namedTypeItems(metadataRecord(params.model)["dimensions"])
  const resources = namedTypeItems(metadataRecord(params.model)["resources"])
  const addressingAttributes = namedTypeItems(metadataRecord(params.model)["addressingAttributes"])
  const standardAttributes = namedTypeItems(metadataRecord(params.model)["standardAttributes"])
  const tabularSections = namedTabularSections(metadataRecord(params.model)["tabularSections"])
  const commands = namedTypeItems(metadataRecord(params.model)["commands"])

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
    ...(typeof registerType === "string" ? { registerType } : {}),
    ...(attributes.length === 0 ? {} : { attributes }),
    ...(dimensions.length === 0 ? {} : { dimensions }),
    ...(resources.length === 0 ? {} : { resources }),
    ...(addressingAttributes.length === 0 ? {} : { addressingAttributes }),
    ...(standardAttributes.length === 0 ? {} : { standardAttributes }),
    ...(tabularSections.length === 0 ? {} : { tabularSections }),
    ...(commands.length === 0 ? {} : { commands }),
  }
}

export const collectOwnerFactFromYAML: CollectLocalFactsFromYAMLFunction = ({ fact, writer }) => {
  const role = fact.rule.ownerFactRole
  if (role === undefined) return
  const value = normalizedOwnerFact(role, fact.value)
  if (value !== undefined) writer.setOwnerFact(role, value)
}

function normalizedOwnerFact(role: OwnerFactRole, value: unknown): unknown {
  if (role === "type") return typeDescriptionFromYAML(value)
  if (role === "attributes" || role === "dimensions" || role === "resources" || role === "addressingAttributes")
    return namedTypedItemsFromYaml(value)
  if (role === "tabularSections") return tabularSectionsFromYaml(value)
  if (role === "standardAttributes" || role === "accountingFlags" || role === "extDimensionAccountingFlags")
    return namedTypedItemsFromYaml(value)
  if (role === "owners" || role === "registerRecords") return metadataLinksFromYaml(value)
  if (role === "task") return taskLinkFromYaml(value)
  if (role === "chartOfAccounts" || role === "extDimensionTypes")
    return typeof value === "string" ? metadataLinkFromYaml(value) : undefined
  if (role === "commonAttributeOwnerLinks") return commonAttributeOwnerLinksFromYaml(value)
  if (role === "registerType") return typeof value === "string" ? value : undefined
  if (role === "commands") return namedTypedItemsFromYaml(value)
  return undefined
}

export function ownerFactFromYAML(role: OwnerFactRole, value: unknown): unknown {
  return normalizedOwnerFact(role, value)
}

function namedTypedItemsFromYaml(value: unknown): NamedTypeItems {
  return Object.entries(metadataRecord(value)).map(([name, item]) => {
    const type = typeDescriptionFromYAML(metadataRecord(item)["Тип"])
    return { name, ...(type === undefined ? {} : { type }) }
  })
}

function tabularSectionsFromYaml(
  value: unknown
): Array<{ name: string; attributes: NamedTypeItems; standardAttributes?: NamedTypeItems }> {
  return Object.entries(metadataRecord(value)).map(([name, item]) => {
    const record = metadataRecord(item)
    const standardAttributes = namedTypedItemsFromYaml(record["СтандартныеРеквизиты"])
    return {
      name,
      attributes: namedTypedItemsFromYaml(record["Реквизиты"]),
      ...(standardAttributes.length === 0 ? {} : { standardAttributes }),
    }
  })
}

function metadataLinksFromYaml(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").map(metadataLinkFromYaml)
    : []
}

function metadataLinkFromYaml(value: string): string {
  const normalized = value.startsWith("Справочники.")
    ? `Справочник.${value.slice("Справочники.".length)}`
    : value.startsWith("ПланыВидовРасчета.")
      ? `ПланВидовРасчета.${value.slice("ПланыВидовРасчета.".length)}`
      : value
  const dotIndex = normalized.indexOf(".")
  if (dotIndex === -1) return normalized
  const root = normalized.substring(0, dotIndex)
  return `${rootFromYAML[root] ?? root}${normalized.substring(dotIndex)}`
}

function taskLinkFromYaml(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length === 0) return undefined
  return value.includes(".") ? metadataLinkFromYaml(value) : `Task.${value}`
}

function commonAttributeOwnerLinksFromYaml(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    const record = metadataRecord(item)
    if (typeof record["Объект"] !== "string") return []
    const rawUse = record["Использование"]
    const use =
      typeof rawUse === "string" && rawUse in CommonAttributeUseFromYAML
        ? CommonAttributeUseFromYAML[rawUse as CommonAttributeUseYAML]
        : "Use"
    return use === "Use" ? [metadataLinkFromYaml(record["Объект"])] : []
  })
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

function namedTabularSections(
  value: unknown
): Array<{ name: string; attributes: NamedTypeItems; standardAttributes?: NamedTypeItems }> {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    const record = metadataRecord(item)
    if (typeof record["name"] !== "string") return []
    const attributes = namedTypeItems(record["attributes"])
    const standardAttributes = namedTypeItems(record["standardAttributes"])
    return [{ name: record["name"], attributes, ...(standardAttributes.length === 0 ? {} : { standardAttributes }) }]
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
