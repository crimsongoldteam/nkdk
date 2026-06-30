import type { ConfigurationContext } from "~/metadata/context/types"
import type { ParsedYaml } from "~/yaml/parseMetadataYaml"
import type { OwnerMetadataCache } from "./dataPath/ownerCache"
import type { ProjectYamlCache } from "./projectYamlCache"
import type { Diagnostic } from "./types"

export interface RegisteredFormValidatorParams {
  projectDir: string
  formDir: string
  formName: string
  owner: { dir: string; name: string }
  cache: ProjectYamlCache
  context?: ConfigurationContext
  ownerCache?: OwnerMetadataCache
  suppressFormImportDiagnostics?: boolean
}

export type RegisteredFormValidator = (params: RegisteredFormValidatorParams) => Diagnostic[]

export type FormPlatformSourceMatcher = (path: string) =>
  | {
      kind: "platformSource"
      path: string
      matchedSource: string
      match: "exact" | "prefix"
    }
  | undefined

export type FormWarningProvider = (params: { filePath: string; parsed: ParsedYaml }) => Diagnostic[]

let formValidator: RegisteredFormValidator | undefined
const platformSourceMatchers: FormPlatformSourceMatcher[] = []
const warningProviders: FormWarningProvider[] = []

export function registerFormValidator(validator: RegisteredFormValidator): void {
  formValidator = validator
}

export function getRegisteredFormValidator(): RegisteredFormValidator | undefined {
  return formValidator
}

export function registerFormPlatformSourceMatcher(matcher: FormPlatformSourceMatcher): void {
  platformSourceMatchers.push(matcher)
}

export function matchRegisteredFormPlatformSource(path: string): ReturnType<FormPlatformSourceMatcher> {
  for (const matcher of platformSourceMatchers) {
    const result = matcher(path)
    if (result !== undefined) return result
  }
  return undefined
}

export function registerFormWarningProvider(provider: FormWarningProvider): void {
  warningProviders.push(provider)
}

export function getFormWarningProviders(): readonly FormWarningProvider[] {
  return warningProviders
}
