import type { ConfigurationContext } from "../context/types"
import type { ParsedYaml } from "../../yaml/parseMetadataYaml"
import type { OwnerMetadataCache } from "./dataPath/contracts"
import type { ProjectYamlCache } from "./projectYamlCache"
import type { Diagnostic } from "./types"
import type { FormValidationAdapter } from "./formContracts"
import { currentValidationRegistrySet } from "./validationExecutionContext"

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

export type RegisteredFormFirstPassResult = RegisteredFormFirstPassOk | RegisteredFormFirstPassFailed

export interface RegisteredFormFirstPassParams extends RegisteredFormValidatorParams {}

export interface RegisteredFormSecondPassParams {
  state: unknown
  ownerCache: OwnerMetadataCache
}

export type RegisteredFormFirstPassValidator = (params: RegisteredFormFirstPassParams) => RegisteredFormFirstPassResult

export type RegisteredFormSecondPassValidator = (params: RegisteredFormSecondPassParams) => Diagnostic[]

export type FormPlatformSourceMatcher = (path: string) =>
  | {
      kind: "platformSource"
      path: string
      matchedSource: string
      match: "exact" | "prefix"
    }
  | undefined

export type FormWarningProvider = (params: { filePath: string; parsed: ParsedYaml }) => Diagnostic[]

export function getFormValidationAdapter(): FormValidationAdapter | undefined {
  return currentFormRegistry()?.adapter
}

export function requireFormValidationAdapter(): FormValidationAdapter {
  const adapter = getFormValidationAdapter()
  if (adapter === undefined) {
    throw new Error("Не зарегистрирован адаптер validation для ClientApplicationForm")
  }
  return adapter
}

export function getRegisteredFormValidator(): RegisteredFormValidator | undefined {
  return currentFormRegistry()?.validator
}

export function getRegisteredFormValidationPasses():
  | { firstPass: RegisteredFormFirstPassValidator; secondPass: RegisteredFormSecondPassValidator }
  | undefined {
  return currentFormRegistry()?.passes
}

export function matchRegisteredFormPlatformSource(path: string): ReturnType<FormPlatformSourceMatcher> {
  for (const matcher of currentFormRegistry()?.platformSourceMatchers ?? []) {
    const result = matcher(path)
    if (result !== undefined) return result
  }
  return undefined
}

export function getFormWarningProviders(): readonly FormWarningProvider[] {
  return currentFormRegistry()?.warningProviders ?? []
}

function currentFormRegistry(): {
  readonly validator?: RegisteredFormValidator
  readonly adapter?: FormValidationAdapter
  readonly passes?: {
    readonly firstPass: RegisteredFormFirstPassValidator
    readonly secondPass: RegisteredFormSecondPassValidator
  }
  readonly platformSourceMatchers: readonly FormPlatformSourceMatcher[]
  readonly warningProviders: readonly FormWarningProvider[]
} | undefined {
  return currentValidationRegistrySet<{ form: ReturnType<typeof currentFormRegistry> }>()?.form
}
