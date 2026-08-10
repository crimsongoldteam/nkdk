import {
  registerFormPlatformSourceMatcher,
  registerFormValidationAdapter,
  registerFormValidationPasses,
  registerFormValidator,
  registerFormWarningProvider,
} from "../../validation/formValidationRegistry"
import { registerFormDataPathMetadataProjection } from "../../validation/formDataPathProjectionRegistry"
import {
  collectDynamicListTypeValueWarnings,
  validateClientApplicationForm,
  validateClientApplicationFormFirstPass,
  validateClientApplicationFormSecondPass,
} from "./validate"
import { clientApplicationFormDataPathProjection } from "./formDataPathProjection"
import { clientApplicationFormValidationAdapter } from "./validationAdapter"
import { registerFormStructureProjection } from "../../validation/formStructureProjectionRegistry"
import { projectClientApplicationFormStructure } from "./formStructureProjection"
import "./childFormNamesImportAdapter"
import "./childFormNamesResourceAdapter"
import "./importedYamlFinalizer"
import "./propertyRules"
import "./fromYAMLToXML"

registerFormValidationAdapter(clientApplicationFormValidationAdapter)
registerFormStructureProjection(projectClientApplicationFormStructure)

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
