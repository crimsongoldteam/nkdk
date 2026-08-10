import { defineMetadataRules } from "../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../ruleRuntime/definition/testSupport"
import { ClientApplicationFormRules } from "./rules"
import {
  FORM_ELEMENT_NAMES_PROFILE_SUBSTEP,
  validateFormElementNames,
} from "./validateElementNames"

export const clientApplicationFormValidationRules = defineMetadataRules({
  ...emptyMetadataRules,
  validation: [
    {
      kind: "localYamlValue",
      propertyType: "ClientApplicationForm",
      profileSubstep: FORM_ELEMENT_NAMES_PROFILE_SUBSTEP,
      validate: (params) =>
        validateFormElementNames({
          ...params,
          rule: ClientApplicationFormRules,
        }),
    },
  ],
})
