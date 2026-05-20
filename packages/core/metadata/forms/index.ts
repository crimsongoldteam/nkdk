export { exportFormMetadataToXML } from "./clientApplicationForm/toXML"
export type { FormMetadataXML } from "./clientApplicationForm/types"

export {
  clearElementRulesRegistry,
  getElementRule,
  registerElementRule,
} from "../orchestration/formElement/ruleFactory"
export type { ElementRule } from "../orchestration/formElement/types"

import "./elements"
import "./commonObjects/index"
