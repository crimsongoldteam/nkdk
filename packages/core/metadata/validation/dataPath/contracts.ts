import type { TypeDescriptionView } from "../../orchestration/property/typeDescriptionView"
import type { MetadataItemRule } from "../../orchestration/property/types"
import type { Diagnostic } from "../types"
import type { ValidationProjectSpec } from "../projectSpecs"
import type { DataPathTableInfo, DataPathTypeInfo, OwnerTypeRef } from "./types"

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

export type ValidationNamedTypeItems = Array<{ name: string; type?: TypeDescriptionView }>

export interface ValidationOwnerFacts {
  ref: OwnerTypeRef
  filePath: string
  fieldIndex: ObjectFieldIndex
  type?: TypeDescriptionView
  commonAttributeOwnerLinks?: string[]
  owners?: string[]
  task?: string
  registerRecords?: string[]
  chartOfAccounts?: string
  extDimensionTypes?: string
  accountingFlags?: ValidationNamedTypeItems
  extDimensionAccountingFlags?: ValidationNamedTypeItems
  registerType?: string
  attributes?: ValidationNamedTypeItems
  dimensions?: ValidationNamedTypeItems
  resources?: ValidationNamedTypeItems
  addressingAttributes?: ValidationNamedTypeItems
  tabularSections?: Array<{ name: string; attributes: ValidationNamedTypeItems; standardAttributes?: ValidationNamedTypeItems }>
  standardAttributes?: ValidationNamedTypeItems
  commands?: ValidationNamedTypeItems
  predefined?: ValidationNamedTypeItems
  enumValues?: ValidationNamedTypeItems
}

export interface OwnerMetadataCache {
  get(ref: OwnerTypeRef): OwnerMetadataResult
  listRefs(kind: OwnerTypeRef["kind"]): Iterable<OwnerTypeRef>
}

export type OwnerMetadataResult =
  | { status: "ok"; owner: OwnerMetadata }
  | { status: "not-found"; diagnostics: Diagnostic[] }
  | { status: "import-error"; diagnostics: Diagnostic[] }
  | { status: "ambiguous"; diagnostics: Diagnostic[] }

export interface OwnerMetadata {
  ref: OwnerTypeRef
  filePath: string
  facts: ValidationOwnerFacts
  rule: MetadataItemRule
  spec: ValidationProjectSpec
  fieldIndex: ObjectFieldIndex
}
