export type { FormMetadataXML } from "./clientApplicationForm/types"

export { clearElementRulesRegistry, getElementRule, registerElementRule } from "./elements/orchestration/ruleFactory"
export type { ElementRule } from "./elements/orchestration/types"

import "./elements"
import "./commonObjects/index"
import "./schemaRegister"
import "./clientApplicationForm/register"

let formsRegistered = false

export function registerForms(): void {
  if (formsRegistered) return
  formsRegistered = true
}
