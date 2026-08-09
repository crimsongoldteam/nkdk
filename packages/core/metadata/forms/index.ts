export type { FormMetadataXML } from "./clientApplicationForm/types"

export { clearElementRulesRegistry, getElementRule, registerElementRule } from "./elements/ruleRuntime/ruleFactory"
export type { ElementRule } from "./elements/ruleRuntime/types"

import "./elements"
import "./commonObjects/index"
import "./commonObjects/dynamicList/types"
import "./schemaRegister"
import "./clientApplicationForm/register"

let formsRegistered = false

export function registerForms(): void {
  if (formsRegistered) return
  formsRegistered = true
}
