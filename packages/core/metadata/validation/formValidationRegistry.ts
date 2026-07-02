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

export interface RegisteredFormFirstPassOk {
  status: "ok"
  diagnostics: Diagnostic[]
  state: unknown
}

export interface RegisteredFormFirstPassFailed {
  status: "failed"
  diagnostics: Diagnostic[]
}

export type RegisteredFormFirstPassResult =
  | RegisteredFormFirstPassOk
  | RegisteredFormFirstPassFailed

export interface RegisteredFormFirstPassParams extends RegisteredFormValidatorParams {}

export interface RegisteredFormSecondPassParams {
  state: unknown
  ownerCache: OwnerMetadataCache
}

export type RegisteredFormFirstPassValidator = (
  params: RegisteredFormFirstPassParams,
) => RegisteredFormFirstPassResult

export type RegisteredFormSecondPassValidator = (
  params: RegisteredFormSecondPassParams,
) => Diagnostic[]

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
let formFirstPassValidator: RegisteredFormFirstPassValidator | undefined
let formSecondPassValidator: RegisteredFormSecondPassValidator | undefined
const platformSourceMatchers: FormPlatformSourceMatcher[] = []
const warningProviders: FormWarningProvider[] = []

export function registerFormValidator(validator: RegisteredFormValidator): void {
  formValidator = validator
}

export function getRegisteredFormValidator(): RegisteredFormValidator | undefined {
  return formValidator
}

export function registerFormValidationPasses(params: {
  firstPass: RegisteredFormFirstPassValidator
  secondPass: RegisteredFormSecondPassValidator
}): void {
  formFirstPassValidator = params.firstPass
  formSecondPassValidator = params.secondPass
}

export function getRegisteredFormValidationPasses():
  | { firstPass: RegisteredFormFirstPassValidator; secondPass: RegisteredFormSecondPassValidator }
  | undefined {
  return formFirstPassValidator && formSecondPassValidator
    ? { firstPass: formFirstPassValidator, secondPass: formSecondPassValidator }
    : undefined
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
