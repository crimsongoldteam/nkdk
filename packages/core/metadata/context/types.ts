import type { TSchema } from "typebox"
import type { MetadataItemType, ToMetadata } from "../ruleRuntime/metadataItem/registry"
import type { ExternalMetadataCollector, ExternalMetadataItemRule } from "../ruleRuntime/externalMetadata/types"
import type { MetadataTargetOwner } from "../ruleRuntime/metadataTarget/types"
import type { PropertyRuleType } from "../ruleRuntime/property/registry"

export type ContextElementToXML = {
  name: string
  itemType: MetadataItemType
  path: string
  externalMetadata?: ExternalMetadataItemRule
}

export type JSONSchemaExportMode = "externalRefs" | "inline"

export interface MetadataContextTypeMap {}

type MetadataContextType<Name extends PropertyKey> = Name extends keyof MetadataContextTypeMap
  ? MetadataContextTypeMap[Name]
  : never

type FormElementType = MetadataContextType<"formElementType">
type FormElementXML = MetadataContextType<"formElementXML">

export interface JSONSchemaExportContext {
  mode: JSONSchemaExportMode
  refs: Set<string>
  excludeImplicitValueYAML?: boolean
  includeNestedChildItems?: boolean
  validationPropertyRefs?: true
  propertySchemaOverrides?: Partial<Record<PropertyRuleType, TSchema>>
  schemaStack?: PropertyRuleType[]
}

export type ContextElementToEnterprise =
  | {
      itemType: FormElementType
      dataPath: string
      dataPathEnterprise: string
    }
  | { itemType: FormElementType; dataPath: undefined; dataPathEnterprise: undefined }

export interface ConfigurationContext {
  testMode?: boolean
  defaultLanguage: string
  version: string
  context?: object
  exportToYAML?: FormExportToYAMLContext
  importFromYAML?: FormimportFromYAMLContext
  exportToXML?: ToXMLConfigurationContext
  exportToJSONSchema?: JSONSchemaExportContext
}

export interface ConfigurationContextFromXML extends ConfigurationContext {
  fromXML: FromXMLConfigurationContext
}

/** Контекст полного XML-import, передаваемый между главным процессом и Piscina worker. */
export interface XmlImportConfigurationContext extends ConfigurationContextFromXML {
  fromXML: XmlImportFromXMLConfigurationContext
}

export type XMLDefaultVariant = "full" | "adopted" | "indexed"

type ToXMLContextElement<Type extends MetadataItemType> = {
  element: ToMetadata<Type> | undefined
  referenceElement?: ToMetadata<Type> | undefined
  xmlElement: FormElementXML
  numberingScope?: unknown
}

export interface ToXMLConfigurationContext {
  /** Запрещает создавать заново идентификаторы, объявленные nested rule обязательными. */
  readonly requireExistingConfigurationIdentities?: true
  readonly componentKind?: string
  readonly adoptedUuids?: Readonly<Record<string, string>>
  readonly xmlDefaultVariantByLogicalAddress?: Readonly<Record<string, XMLDefaultVariant>>
  readonly externalMetadataCollector?: ExternalMetadataCollector
  readonly version: string
  readonly itemsTree: ContextElementToXML[]
  context?: {
    forms: string[]
    templates: string[]
    parentName: string
    metadataForNumbering: ToXMLContextElement<
      FormElementType | "FormAttributeColumn" | "FormAttribute" | "FormCommand"
    >[]
    currentXMLPath?: string
    /** Стек текущего ItemXML для ElementId и нумерации _id. */
    propertiesItemXmlStack?: Record<string, unknown>[]
  }
}

export interface FromXMLConfigurationContext {
  forReference: boolean
}

export type XmlImportFromXMLConfigurationContext = FromXMLConfigurationContext & {
  /** Строковый вид компонента; его можно передавать в Piscina без функций правил. */
  componentKind: string
  /** Имя зарегистрированного дополнения метаданных, если оно требуется компоненту. */
  metadataItemAugmenter?: string
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

export type FormDataPathAttributeContext = MetadataContextType<"formDataPathAttribute">
export interface EnterpriseContext {}

export interface FormExportToYAMLContext {
  toTyped: boolean
  /** Путь к корню YAML-проекта для чтения владельцев DataPath. */
  projectDir?: string
  /** Имя родительского объекта (например, имя реквизита формы) для externalFile. */
  parent?: { name: string }
  /** Сборник внешних файлов, формируемых при экспорте. */
  externalFilesCollector?: ExternalFileEntry[]
  /** Стек текущих metadata item владельцев для owner: "this" metadataTarget. */
  metadataTargetOwners?: MetadataTargetOwnerContext[]
}

export interface FormimportFromYAMLContext {
  /** Путь к корню YAML-проекта для чтения владельцев DataPath. */
  projectDir?: string
  /** Путь к каталогу формы для чтения внешних файлов (externalFile). */
  formDir?: string
  /** Имя родительского объекта для externalFile (например, имя реквизита формы). */
  parent?: { name: string }
  /** Стек текущих metadata item владельцев для owner: "this" metadataTarget. */
  metadataTargetOwners?: MetadataTargetOwnerContext[]
  /** Сопоставление текущих и reference-путей для вложенных metadata-коллекций. */
  referenceRemap?: {
    readonly currentPath: string
    readonly referencePathByCurrentPath: ReadonlyMap<string, string>
  }
}
