import { PreviewAttributeMapItem } from "../forms/clientApplicationForm/base/types"
import { AllChildItemsPartialEnterprise } from "../forms/collections/childItems/types"
import { NamedElement } from "../forms/elements/baseElement/types"

export interface ConfigurationContext {
  testMode?: boolean
  defaultLanguage: string
  context?: object
  allElements?: AllChildItemsPartialEnterprise
  preview?: {
    prefix: string
    attributes: Record<string, PreviewAttributeMapItem>
  }

  elementContext?: NamedElement
}
