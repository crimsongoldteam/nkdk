import {
  registerFormPlatformSourceMatcher,
  registerFormValidationPasses,
  registerFormValidator,
  registerFormWarningProvider,
} from "~/metadata/validation/formValidationRegistry"
import {
  collectDynamicListTypeValueWarnings,
  validateClientApplicationForm,
  validateClientApplicationFormFirstPass,
  validateClientApplicationFormSecondPass,
} from "./validate"

registerFormValidator(validateClientApplicationForm)
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
