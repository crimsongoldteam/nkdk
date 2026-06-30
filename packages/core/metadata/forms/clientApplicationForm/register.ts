import {
  registerFormPlatformSourceMatcher,
  registerFormValidator,
  registerFormWarningProvider,
} from "~/metadata/validation/formValidationRegistry"
import {
  collectDynamicListTypeValueWarnings,
  validateClientApplicationForm,
} from "./validate"

registerFormValidator(validateClientApplicationForm)
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
