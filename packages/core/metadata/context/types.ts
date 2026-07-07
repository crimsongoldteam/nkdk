import type { TSchema } from "typebox"
import { ConfigDumpInfo } from "../appliedObjects/configDumpInfo/types"
import { EnterpriseAttributeMapItem } from "../forms/clientApplicationForm/types"
import { FormChildItemsPartialYAML, FormElementsYAML } from "../forms/commonObjects/childItems/types"
import { ElementType, ElementXMLWithoutId, MetadataItemType, ToMetadata } from "../orchestration"
import type { ExternalMetadataCollector, ExternalMetadataItemRule } from "../orchestration/externalMetadata/types"
import type { MetadataTargetOwner } from "../commonObjects/metadataTargets/types"
import type { PropertyRuleType } from "../orchestration/property/registry"

export type ContextElementToXML = {
  name: string
  itemType: MetadataItemType
  path: string
  externalMetadata?: ExternalMetadataItemRule
}

export type JSONSchemaExportMode = "externalRefs" | "inline"

export interface JSONSchemaExportContext {
  mode: JSONSchemaExportMode
  refs: Set<string>
  excludeImplicitValueYAML?: boolean
  includeNestedChildItems?: boolean
  propertySchemaOverrides?: Partial<Record<PropertyRuleType, TSchema>>
  schemaStack?: PropertyRuleType[]
}

export type ContextElementToEnterprise =
  | {
      itemType: ElementType
      dataPath: string
      dataPathEnterprise: string
    }
  | { itemType: ElementType; dataPath: undefined; dataPathEnterprise: undefined }

export interface ConfigurationContext {
  testMode?: boolean
  defaultLanguage: string
  version: string
  context?: object
  allElements?: FormElementsYAML
  enterprise?: EnterpriseContext

  exportToYAML?: FormExportToYAMLContext
  importFromYAML?: FormimportFromYAMLContext
  exportToXML?: ToXMLConfigurationContext
  exportToJSONSchema?: JSONSchemaExportContext
}

export interface ConfigurationContextFromXML extends ConfigurationContext {
  fromXML: FromXMLConfigurationContext
}

type ToXMLContextElement<Type extends MetadataItemType> = {
  element: ToMetadata<Type> | undefined
  referenceElement?: ToMetadata<Type> | undefined
  xmlElement: ElementXMLWithoutId
  numberingScope?: unknown
}

export type ToXMLConfigurationContext = {
  readonly configDumpInfo: ConfigDumpInfo
  readonly externalMetadataCollector?: ExternalMetadataCollector
  readonly version: string
  readonly itemsTree: ContextElementToXML[]
  context?: {
    forms: string[]
    templates: string[]
    parentName: string
    metadataForNumbering: ToXMLContextElement<ElementType | "FormAttributeColumn" | "FormAttribute" | "FormCommand">[]
    currentXMLPath?: string
    /** Стек объекта ItemXML, собираемого exportPropertiesToXML (для ElementId и нумерации _id) */
    propertiesItemXmlStack?: Record<string, unknown>[]
  }
}

export type FromXMLConfigurationContext = {
  forReference: boolean
}

/** Контекст с обязательным exportToXML для функций экспорта в XML */
export type ConfigurationContextWithExportToXML = ConfigurationContext & {
  exportToXML: ToXMLConfigurationContext
}

export interface ExternalFileEntry {
  relativePath: string
  content: string
}

export interface MetadataTargetOwnerContext {
  itemType: MetadataItemType
  name: string
  owner?: MetadataTargetOwner
}

export interface FormExportToYAMLContext {
  toTyped: boolean
  /** Имя родительского объекта (например, имя реквизита формы) для externalFile. */
  parent?: { name: string }
  /** Сборник внешних файлов, формируемых при экспорте. */
  externalFilesCollector?: ExternalFileEntry[]
  /** Стек текущих metadata item владельцев для owner: "this" metadataTarget. */
  metadataTargetOwners?: MetadataTargetOwnerContext[]
}

export interface FormimportFromYAMLContext {
  allElements?: FormChildItemsPartialYAML
  /** Путь к каталогу формы для чтения внешних файлов (externalFile). */
  formDir?: string
  /** Имя родительского объекта для externalFile (например, имя реквизита формы). */
  parent?: { name: string }
  /** Стек текущих metadata item владельцев для owner: "this" metadataTarget. */
  metadataTargetOwners?: MetadataTargetOwnerContext[]
}

export interface EnterpriseContext {
  prefix: string
  attributes: Record<string, EnterpriseAttributeMapItem>
  elementsTree: Array<ContextElementToEnterprise>
  allElementsNames: string[]
}
