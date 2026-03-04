import { EnterpriseAttributeMapItem } from "../forms/clientApplicationForm/types"
import { AllChildItemsPartialYAML } from "../forms/commonObjects/childItems/types"
import { FormElementType } from "../orchestration"

export type ContextElementToXML = { name: string; itemType: FormElementType }
export type ContextElementToEnterprise = { itemType: FormElementType; dataPath: string | undefined }

export interface ConfigurationContext {
  testMode?: boolean
  defaultLanguage: string
  context?: object
  allElements?: AllChildItemsPartialYAML
  enterprise?: EnterpriseContext

  elementsTree?: Array<ContextElementToXML>

  exportToYAML?: FormExportToYAMLContext
  // formAttributeImportFromYAML?: FormAttributeImportFromYAMLContext
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
}
