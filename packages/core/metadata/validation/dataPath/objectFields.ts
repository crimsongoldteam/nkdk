import { MetadataTabularSectionRules } from "~/metadata/commonObjects/metadataTabularSection/rules"
import type { TypeDescription } from "~/metadata/commonObjects/typeDescription/types"
import type { MetadataItem, PropertyRule, StandardAttributeDescriptionsPropertyRule } from "~/metadata/orchestration/property/types"
import type { Diagnostic } from "../types"
import { diagnosticAtYamlPath, type YamlPath } from "../yamlLocations"
import type { OwnerMetadata } from "./ownerCache"
import { typeDescriptionToDataPathTypeInfo } from "./typeDescription"
import {
  type DataPathTableInfo,
  type DataPathTypeInfo,
  type OwnerTypeRef,
  unknownDataPathTypeInfo,
} from "./types"

export type ObjectFieldKind = "attribute" | "standardAttribute" | "tabularSection" | "dimension" | "resource"

export interface ObjectField {
  name: string
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
  diagnostics: Diagnostic[]
}

export interface ValidateObjectFieldSegmentParams {
  owner: OwnerMetadata
  segment: string
  dataPathValue?: string
  filePath: string
  parsed: Parameters<typeof diagnosticAtYamlPath>[0]["parsed"]
  yamlPath: YamlPath
}

type ObjectFieldIndexOwner = Pick<OwnerMetadata, "ref" | "model" | "rule">

interface NamedTypedItem {
  name?: unknown
  type?: TypeDescription
  attributes?: NamedTypedItem[]
  standardAttributes?: NamedTypedItem[]
}

const dataCollectionKinds = {
  attributes: "attribute",
  tabularSections: "tabularSection",
  dimensions: "dimension",
  resources: "resource",
} as const satisfies Record<string, ObjectFieldKind>

const platformFieldNames = new Set(["Ref", "Description", "Number", "Date"])

export function buildObjectFieldIndex(owner: ObjectFieldIndexOwner): ObjectFieldIndex {
  const fields = new Map<string, ObjectField>()
  const diagnostics: Diagnostic[] = []

  addDataCollectionFields({ owner, fields })
  addStandardAttributeFields({
    owner,
    fields,
    propertyRule: owner.rule.properties.standardAttributes,
    sourceCollection: "standardAttributes",
  })

  return { fields, diagnostics }
}

export function validateObjectFieldSegment({
  owner,
  segment,
  dataPathValue,
  filePath,
  parsed,
  yamlPath,
}: ValidateObjectFieldSegmentParams): Diagnostic[] {
  if (!platformFieldNames.has(segment)) return []
  const subject =
    dataPathValue === undefined ? `DataPath для ${formatOwnerRef(owner.ref)}` : `ПутьКДанным "${dataPathValue}"`

  return [
    diagnosticAtYamlPath({
      filePath,
      parsed,
      path: yamlPath,
      severity: "error",
      source: "structure",
      message: `${subject}: используйте YAML-имя реквизита вместо платформенного "${segment}"`,
    }),
  ]
}

function addDataCollectionFields(params: { owner: ObjectFieldIndexOwner; fields: Map<string, ObjectField> }): void {
  const { owner, fields } = params
  const model = metadataRecord(owner.model)

  for (const [collection, kind] of Object.entries(dataCollectionKinds)) {
    if (owner.rule.properties[collection] === undefined) continue

    const items = getNamedItems(model[collection])
    for (const item of items) {
      if (typeof item.name !== "string" || item.name.length === 0) continue

      if (kind === "tabularSection") {
        fields.set(item.name, buildTabularSectionField(owner, item, collection))
        continue
      }

      fields.set(item.name, {
        name: item.name,
        kind,
        sourceCollection: collection,
        typeInfo: typeDescriptionToDataPathTypeInfo(item.type),
      })
    }
  }
}

function addStandardAttributeFields(params: {
  owner: ObjectFieldIndexOwner
  fields: Map<string, ObjectField>
  propertyRule: PropertyRule | undefined
  sourceCollection: string
}): void {
  const { owner, fields, propertyRule, sourceCollection } = params
  if (propertyRule?.type !== "StandardAttributeDescriptions") return

  const rule = propertyRule as StandardAttributeDescriptionsPropertyRule
  const explicitItems = standardAttributesByInternalName(metadataRecord(owner.model)[sourceCollection])
  const standardAttributeNames = rule.standartAttributeNamesXML?.(owner.model) ?? rule.standartAttributeNames

  for (const [internalName, yamlName] of Object.entries(standardAttributeNames)) {
    const explicit = explicitItems.get(internalName)
    fields.set(yamlName, {
      name: yamlName,
      kind: "standardAttribute",
      sourceCollection,
      typeInfo: standardAttributeTypeInfo({ owner, internalName, yamlName, explicit }),
    })
  }
}

function buildTabularSectionField(
  owner: ObjectFieldIndexOwner,
  tabularSection: NamedTypedItem,
  sourceCollection: string,
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
  if (params.explicit?.type !== undefined) return typeDescriptionToDataPathTypeInfo(params.explicit.type)

  if (params.internalName === "Ref" || params.yamlName === "Ссылка") {
    return {
      kinds: ["object"],
      nextTypes: [sameOwnerRef(params.owner.ref)],
    }
  }

  return unknownDataPathTypeInfo
}

function standardAttributesByInternalName(value: unknown): Map<string, NamedTypedItem> {
  const items = getNamedItems(value)
  return new Map(items.filter((item): item is NamedTypedItem & { name: string } => typeof item.name === "string").map((item) => [item.name, item]))
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

function sameOwnerRef(ref: OwnerTypeRef): OwnerTypeRef {
  return {
    kind: ref.kind,
    ...(ref.name !== undefined ? { name: ref.name } : {}),
  }
}

function formatOwnerRef(ref: OwnerTypeRef): string {
  return ref.name ? `${ref.kind}.${ref.name}` : ref.kind
}
