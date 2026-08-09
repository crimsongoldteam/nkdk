import { CollectableElementTypeFromYAML, type ElementType } from "../../ruleRuntime/formElement/types"
import type { FormValidationAdapter } from "../../validation/formContracts"
import { ClientApplicationFormRules } from "./rules"
import {
  createFormElementNameCollector,
  FORM_ELEMENT_NAMES_PROFILE_SUBSTEP,
} from "./validateElementNames"

export const clientApplicationFormValidationAdapter: FormValidationAdapter = {
  formRule: ClientApplicationFormRules,
  elementNamesProfileSubstep: FORM_ELEMENT_NAMES_PROFILE_SUBSTEP,
  elementTypeFromYAML(value, tableContext): ElementType | undefined {
    if (typeof value !== "string") return undefined
    if (tableContext !== undefined) {
      if (value === "ПолеВвода") return "TableInputField"
      if (value === "ПолеНадписи") return "TableLabelField"
      if (value === "ПолеРисунка") return "TablePictureField"
      if (value === "ПолеФлажок") return "TableCheckBoxField"
    }
    return CollectableElementTypeFromYAML[value as keyof typeof CollectableElementTypeFromYAML]
  },
  createElementNameCollector: createFormElementNameCollector,
}
