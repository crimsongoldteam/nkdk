import { PreviewAttributeMapItem } from "../forms/clientApplicationForm/base/types"
import { AllChildItemsPartialEnterprise } from "../forms/collections/childItems/types"
import { FormElementType } from "../metadataFactory"

export type ContextElementTreeItem = { name: string; elementType: FormElementType }

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
}
