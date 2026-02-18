import { PreviewAttributeMapItem } from "../forms/clientApplicationForm/base/types"
import { AllChildItemsPartialEnterprise } from "../forms/collections/childItems/types"
import { FormElementType } from "../metadataFactory"

export type ContextElementTreeItem = { name: string; itemType: FormElementType }

export interface ConfigurationContext {
  testMode?: boolean
  defaultLanguage: string
  context?: object
  allElements?: AllChildItemsPartialEnterprise
  preview?: {
    prefix: string
    attributes: Record<string, PreviewAttributeMapItem>
  }

  elementsTree?: Array<ContextElementTreeItem>

  exportToYAML?: FormExportToYAMLContext
  // formAttributeImportFromYAML?: FormAttributeImportFromYAMLContext
}

export interface FormExportToYAMLContext {
  toTyped: boolean
}

export interface FormImportFromYAMLContext {
  allElements?: AllChildItemsPartialEnterprise
}

// export interface FormAttributeImportFromYAMLContext {
//   isFormObject: boolean
// }
