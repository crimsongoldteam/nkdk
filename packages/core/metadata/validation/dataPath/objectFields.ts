import { MetadataTabularSectionRules } from "../../commonObjects/metadataTabularSection/rules"
import { StandartAttributeNameToYAML } from "../../commonObjects/standardAttributeDescription/standartAttributeNames"
import type { TypeDescription } from "../../commonObjects/typeDescription/types"
import type {
  MetadataItem,
  PropertyRule,
  StandardAttributeDescriptionsPropertyRule,
} from "../../orchestration/property/types"
import type { Diagnostic } from "../types"
import type { OwnerMetadata } from "./ownerCache"
import {
  getObjectFieldCollectionDescriptors,
  resolveIndexTimeStandardMember,
  resolveStandardAttributeType,
} from "./registry"
import { typeDescriptionToDataPathTypeInfo } from "./typeDescription"
import { type DataPathTableInfo, type DataPathTypeInfo, unknownDataPathTypeInfo } from "./types"

export type ObjectFieldKind =
  | "attribute"
  | "standardAttribute"
  | "tabularSection"
  | "dimension"
  | "resource"
  | "addressingAttribute"

export interface ObjectField {
  name: string
  targetName?: string
  kind: ObjectFieldKind
  typeInfo: DataPathTypeInfo
  tableSource?: ObjectFieldTableSource
  sourceCollection?: string
}

export interface ObjectFieldTableSource {
  table: DataPathTableInfo
  columns: Map<string, ObjectField>
  hasColumns: boolean
}

export interface ObjectFieldIndex {
  fields: Map<string, ObjectField>
  standardAttributeAliases: Map<string, string>
  diagnostics: Diagnostic[]
}

type ObjectFieldIndexOwner = Pick<OwnerMetadata, "ref" | "model" | "rule">

interface NamedTypedItem {
  name?: unknown
  type?: TypeDescription
  attributes?: NamedTypedItem[]
  standardAttributes?: NamedTypedItem[]
}

export function buildObjectFieldIndex(owner: ObjectFieldIndexOwner): ObjectFieldIndex {
  const fields = new Map<string, ObjectField>()
  const standardAttributeAliases = new Map<string, string>()
  const diagnostics: Diagnostic[] = []

  addDataCollectionFields({ owner, fields })
  addStandardAttributeFields({
    owner,
    fields,
    standardAttributeAliases,
    propertyRule: owner.rule.properties.standardAttributes,
    sourceCollection: "standardAttributes",
  })

  return { fields, standardAttributeAliases, diagnostics }
}

export function getObjectField(params: { index: ObjectFieldIndex; name: string }): ObjectField | undefined {
  return params.index.fields.get(params.name)
}

export function resolveObjectFieldSegment(params: {
  index: ObjectFieldIndex
  segment: string
}): ObjectField | undefined {
  const direct = params.index.fields.get(params.segment)
  if (direct !== undefined) return direct

  const alias =
    params.index.standardAttributeAliases.get(params.segment) ?? standardAttributeAliasToYAML(params.segment)
  if (alias !== undefined) return params.index.fields.get(alias)
  return undefined
}

export function standardAttributeAliasToYAML(segment: string): string | undefined {
  return StandartAttributeNameToYAML[segment as keyof typeof StandartAttributeNameToYAML]
}

function addDataCollectionFields(params: { owner: ObjectFieldIndexOwner; fields: Map<string, ObjectField> }): void {
  const { owner, fields } = params
  const model = metadataRecord(owner.model)

  for (const descriptor of getObjectFieldCollectionDescriptors(owner as OwnerMetadata)) {
    const items = getNamedItems(model[descriptor.collection])
    for (const item of items) {
      if (typeof item.name !== "string" || item.name.length === 0) continue

      if (descriptor.kind === "tabularSection") {
        fields.set(item.name, buildTabularSectionField(owner, item, descriptor.collection))
        continue
      }

      fields.set(item.name, {
        name: item.name,
        kind: descriptor.kind,
        sourceCollection: descriptor.collection,
        typeInfo: typeDescriptionToDataPathTypeInfo(item.type),
      })
    }
  }
}

function addStandardAttributeFields(params: {
  owner: ObjectFieldIndexOwner
  fields: Map<string, ObjectField>
  standardAttributeAliases: Map<string, string>
  propertyRule: PropertyRule | undefined
  sourceCollection: string
}): void {
  const { owner, fields, standardAttributeAliases, propertyRule, sourceCollection } = params
  if (propertyRule?.type !== "StandardAttributeDescriptions") return

  const rule = propertyRule as StandardAttributeDescriptionsPropertyRule
  const explicitItems = standardAttributesByInternalName(metadataRecord(owner.model)[sourceCollection])
  const standardAttributeNames = rule.standartAttributeNamesXML?.(owner.model) ?? rule.standartAttributeNames

  for (const [internalName, yamlName] of Object.entries(standardAttributeNames)) {
    const explicit = explicitItems.get(internalName)
    standardAttributeAliases.set(internalName, yamlName)
    const field = {
      name: yamlName,
      targetName: internalName,
      kind: "standardAttribute",
      sourceCollection,
      typeInfo: standardAttributeTypeInfo({ owner, internalName, yamlName, explicit }),
    } satisfies ObjectField
    fields.set(internalName, field)
    if (!fields.has(yamlName)) fields.set(yamlName, field)
  }
}

function buildTabularSectionField(
  owner: ObjectFieldIndexOwner,
  tabularSection: NamedTypedItem,
  sourceCollection: string
): ObjectField {
  const table: DataPathTableInfo = {
    kind: "TabularSection",
    owner: owner.ref,
    name: String(tabularSection.name),
  }
  const columns = new Map<string, ObjectField>()

  for (const attribute of getNamedItems(tabularSection.attributes)) {
    if (typeof attribute.name !== "string" || attribute.name.length === 0) continue

    columns.set(attribute.name, {
      name: attribute.name,
      kind: "attribute",
      sourceCollection: "attributes",
      typeInfo: typeDescriptionToDataPathTypeInfo(attribute.type),
    })
  }

  addStandardAttributeFields({
    owner: {
      ...owner,
      model: tabularSection as MetadataItem,
      rule: MetadataTabularSectionRules,
    },
    fields: columns,
    standardAttributeAliases: new Map(),
    propertyRule: MetadataTabularSectionRules.properties.standardAttributes,
    sourceCollection: "standardAttributes",
  })

  return {
    name: String(tabularSection.name),
    kind: "tabularSection",
    sourceCollection,
    typeInfo: {
      kinds: ["tableSource"],
      nextTypes: [],
      table,
    },
    tableSource: {
      table,
      columns,
      hasColumns: columns.size > 0,
    },
  }
}

function standardAttributeTypeInfo(params: {
  owner: ObjectFieldIndexOwner
  internalName: string
  yamlName: string
  explicit: NamedTypedItem | undefined
}): DataPathTypeInfo {
  const explicitTypeInfo =
    params.explicit?.type === undefined ? undefined : typeDescriptionToDataPathTypeInfo(params.explicit.type)
  const declarative = resolveIndexTimeStandardMember({
    owner: params.owner as OwnerMetadata,
    internalName: params.internalName,
    yamlName: params.yamlName,
    ...(explicitTypeInfo !== undefined ? { explicitTypeInfo } : {}),
  })
  if (declarative !== undefined) return declarative.typeInfo

  return (
    resolveStandardAttributeType({
      owner: params.owner as OwnerMetadata,
      internalName: params.internalName,
      yamlName: params.yamlName,
      ...(explicitTypeInfo !== undefined ? { explicitTypeInfo } : {}),
    }) ?? unknownDataPathTypeInfo
  )
}

function standardAttributesByInternalName(value: unknown): Map<string, NamedTypedItem> {
  const items = getNamedItems(value)
  return new Map(
    items
      .filter((item): item is NamedTypedItem & { name: string } => typeof item.name === "string")
      .map((item) => [item.name, item])
  )
}

function getNamedItems(value: unknown): NamedTypedItem[] {
  return Array.isArray(value) ? value.filter(isNamedTypedItem) : []
}

function isNamedTypedItem(value: unknown): value is NamedTypedItem {
  return typeof value === "object" && value !== null
}

function metadataRecord(model: MetadataItem): Record<string, unknown> {
  return model as MetadataItem & Record<string, unknown>
}
