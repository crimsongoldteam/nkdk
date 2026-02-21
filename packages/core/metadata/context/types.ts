import { EnterpriseAttributeMapItem } from "../forms/clientApplicationForm/base/types"
import { AllChildItemsPartialYAML } from "../forms/collections/childItems/types"
import { FormElementType } from "../metadataFactory"

export type ContextElementTreeItem = { name: string; itemType: FormElementType }

export interface ConfigurationContext {
  testMode?: boolean
  defaultLanguage: string
  context?: object
  allElements?: AllChildItemsPartialYAML
  preview?: {
    prefix: string
    attributes: Record<string, EnterpriseAttributeMapItem>
  }

  elementsTree?: Array<ContextElementTreeItem>

  exportToYAML?: FormExportToYAMLContext
  // formAttributeImportFromYAML?: FormAttributeImportFromYAMLContext
}

export interface FormExportToYAMLContext {
  toTyped: boolean
}

export interface FormImportFromYAMLContext {
  allElements?: AllChildItemsPartialYAML
}

// export interface FormAttributeImportFromYAMLContext {
//   isFormObject: boolean
// }
