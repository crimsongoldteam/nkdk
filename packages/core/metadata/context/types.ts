import { ConfigDumpInfo } from "../appliedObjects/configDumpInfo/types"
import { EnterpriseAttributeMapItem } from "../forms/clientApplicationForm/types"
import { FormChildItemsPartialYAML, FormElementsYAML } from "../forms/commonObjects/childItems/types"
import { ElementType, ElementXMLWithoutId, MetadataItemType, ToMetadata } from "../orchestration"

export type ContextElementToXML = {
  name: string
  itemType: MetadataItemType
  path: string
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
  exportToXML?: ToXMLConfigurationContext
}

export interface ConfigurationContextFromXML extends ConfigurationContext {
  fromXML: FromXMLConfigurationContext
}

type ToXMLContextElement<Type extends MetadataItemType> = {
  element: ToMetadata<Type> | undefined
  referenceElement?: ToMetadata<Type> | undefined
  xmlElement: ElementXMLWithoutId
}

export type ToXMLConfigurationContext = {
  readonly configDumpInfo: ConfigDumpInfo
  readonly version: string
  readonly itemsTree: ContextElementToXML[]
  context?: {
    forms: string[]
    templates: string[]
    parentName: string
    metadataForNumbering: ToXMLContextElement<ElementType | "FormAttributeColumn" | "FormAttribute" | "FormCommand">[]
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

export interface FormExportToYAMLContext {
  toTyped: boolean
}

export interface FormimportFromYAMLContext {
  allElements?: FormChildItemsPartialYAML
}

export interface EnterpriseContext {
  prefix: string
  attributes: Record<string, EnterpriseAttributeMapItem>
  elementsTree: Array<ContextElementToEnterprise>
  allElementsNames: string[]
}
