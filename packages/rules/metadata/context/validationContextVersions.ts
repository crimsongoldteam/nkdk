import type { ConfigurationContext } from "@nkdk/runtime"

export function configurationValidationContextVersions(
  context: ConfigurationContext,
): ReadonlyMap<string, string> {
  return new Map([["languages", context.languages.version]])
}

export function withConfigurationValidationContextVersions<
  T extends { readonly context: ConfigurationContext },
>(params: T): T & { readonly validationContextVersions: ReadonlyMap<string, string> } {
  return {
    ...params,
    validationContextVersions: configurationValidationContextVersions(params.context),
  }
}
