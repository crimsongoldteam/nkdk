import { defineMetadataRules } from "../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../ruleRuntime/definition/testSupport"
import { ClientApplicationFormRules } from "./rules"
import {
  FORM_ELEMENT_NAMES_PROFILE_SUBSTEP,
  validateFormElementNames,
} from "./validateElementNames"
import {
  validateClientApplicationForm,
  validateClientApplicationFormFirstPass,
  validateClientApplicationFormSecondPass,
} from "./validate"
import { clientApplicationFormDataPathProjection } from "./formDataPathProjection"
import { clientApplicationFormValidationAdapter } from "./validationAdapter"
import { projectClientApplicationFormStructure } from "./formStructureProjection"

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
    { kind: "formValidationAdapter", adapter: clientApplicationFormValidationAdapter },
    { kind: "formValidator", validator: validateClientApplicationForm },
    { kind: "formDataPathProjection", projection: clientApplicationFormDataPathProjection },
    { kind: "formStructureProjection", projection: projectClientApplicationFormStructure },
    {
      kind: "formValidationPasses",
      firstPass: validateClientApplicationFormFirstPass,
      secondPass: ({ state, ownerCache }) => validateClientApplicationFormSecondPass({
        state: state as Parameters<typeof validateClientApplicationFormSecondPass>[0]["state"],
        ownerCache,
      }),
    },
  ],
})
