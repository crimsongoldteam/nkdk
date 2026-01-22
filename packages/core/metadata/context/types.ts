import { AllChildItemsPartialEnterprise } from "../forms/collections/childItems/types"

export interface ConfigurationContext {
  testMode?: boolean
  defaultLanguage: string
  context?: object
  allElements?: AllChildItemsPartialEnterprise
}
