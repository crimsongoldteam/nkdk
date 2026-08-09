import {
  registerFormPlatformSourceMatcher,
  registerFormValidationAdapter,
  registerFormValidationPasses,
  registerFormValidator,
  registerFormWarningProvider,
} from "../../validation/formValidationRegistry"
import { registerFormDataPathMetadataProjection } from "../../validation/formDataPathProjectionRegistry"
import { registerLocalYamlValueValidator } from "../../validation/yamlValueValidationRegistry"
import {
  collectDynamicListTypeValueWarnings,
  validateClientApplicationForm,
  validateClientApplicationFormFirstPass,
  validateClientApplicationFormSecondPass,
} from "./validate"
import { ClientApplicationFormRules } from "./rules"
import {
  FORM_ELEMENT_NAMES_PROFILE_SUBSTEP,
  validateFormElementNames,
} from "./validateElementNames"
import { clientApplicationFormDataPathProjection } from "./formDataPathProjection"
import { clientApplicationFormValidationAdapter } from "./validationAdapter"
import "./childFormNamesImportAdapter"
import "./childFormNamesResourceAdapter"

registerFormValidationAdapter(clientApplicationFormValidationAdapter)

registerLocalYamlValueValidator({
  type: "ClientApplicationForm",
  profileSubstep: FORM_ELEMENT_NAMES_PROFILE_SUBSTEP,
  validator: (params) =>
    validateFormElementNames({
      ...params,
      rule: ClientApplicationFormRules,
    }),
})

registerFormValidator(validateClientApplicationForm)
registerFormDataPathMetadataProjection(clientApplicationFormDataPathProjection)
registerFormValidationPasses({
  firstPass: validateClientApplicationFormFirstPass,
  secondPass: ({ state, ownerCache }) =>
    validateClientApplicationFormSecondPass({
      state: state as Parameters<typeof validateClientApplicationFormSecondPass>[0]["state"],
      ownerCache,
    }),
})
registerFormWarningProvider(({ filePath, parsed }) => collectDynamicListTypeValueWarnings({ filePath, parsed }))

for (const source of [
  "КомпоновщикНастроекКомпоновкиДанных.Settings.Filter",
  "КомпоновщикНастроекКомпоновкиДанных.Settings.Use",
  "КомпоновщикНастроекКомпоновкиДанных.Settings",
] as const) {
  registerFormPlatformSourceMatcher((path) => {
    if (path === source) return { kind: "platformSource", path, matchedSource: source, match: "exact" }
    if (path.startsWith(`${source}.`)) return { kind: "platformSource", path, matchedSource: source, match: "prefix" }
    return undefined
  })
}
