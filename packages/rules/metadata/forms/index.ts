export type { FormMetadataXML } from "./clientApplicationForm/types"

export { getElementRule } from "./elements/ruleRuntime/ruleFactory"
export type { ElementRule } from "./elements/ruleRuntime/types"

import "./elements"
import "./commonObjects/index"
import "./commonObjects/dynamicList/types"
import "./schemaRegister"

let formsRegistered = false

export function registerForms(): void {
  if (formsRegistered) return
  formsRegistered = true
}
