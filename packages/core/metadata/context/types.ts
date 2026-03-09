import { ConfigDumpInfo } from "../appliedObjects/configDumpInfo/types"
import { EnterpriseAttributeMapItem } from "../forms/clientApplicationForm/types"
import { AllChildItemsPartialYAML, FormElementsYAML } from "../forms/commonObjects/childItems/types"
import { ElementType, ElementXMLWithoutId, MetadataItemType, ToMetadata, ToReference } from "../orchestration"

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

  // elementsTree?: Array<ContextElementToXML>

  exportToYAML?: FormExportToYAMLContext
  // formAttributeImportFromYAML?: FormAttributeImportFromYAMLContext
  exportToXML?: ToXMLConfigurationContext
}

type ToXMLContextElement<Type extends ElementType> = {
  element: ToMetadata<Type> | undefined
  referenceElement?: ToReference<Type>
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
    elementsMap: ToXMLContextElement<ElementType>[]
  }
}

/** Контекст с обязательным exportToXML для функций экспорта в XML */
export type ConfigurationContextWithExportToXML = ConfigurationContext & {
  exportToXML: ToXMLConfigurationContext
}

export interface FormExportToYAMLContext {
  toTyped: boolean
}

export interface FormImportFromYAMLContext {
  allElements?: AllChildItemsPartialYAML
}

export interface EnterpriseContext {
  prefix: string
  attributes: Record<string, EnterpriseAttributeMapItem>
  elementsTree: Array<ContextElementToEnterprise>
  allElementsNames: string[]
}
