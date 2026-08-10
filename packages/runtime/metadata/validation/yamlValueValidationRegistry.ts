import type { ParsedYaml } from "../../yaml/parseMetadataYaml"
import type { Diagnostic } from "./types"
import type { YamlPath } from "./yamlLocations"

export interface LocalYamlValueValidationParams {
  filePath: string
  parsed: ParsedYaml
  value: unknown
  yamlPath: YamlPath
  owner: { dir: string; name: string }
}

export interface LocalYamlValueValidationProfile {
  substep: string
  timeMs: number
}

export interface LocalYamlValueValidationResult {
  diagnostics: Diagnostic[]
  profile?: LocalYamlValueValidationProfile
}

export type LocalYamlValueValidator = (params: LocalYamlValueValidationParams) => Diagnostic[]

interface LocalYamlValueValidatorRegistration {
  validator: LocalYamlValueValidator
  profileSubstep?: string
}

export interface LocalYamlValueValidationRegistrySnapshot {
  validators: Map<string, LocalYamlValueValidatorRegistration>
}

const validators = new Map<string, LocalYamlValueValidatorRegistration>()

export function registerLocalYamlValueValidator(params: {
  type: string
  validator: LocalYamlValueValidator
  profileSubstep?: string
}): void {
  validators.set(params.type, {
    validator: params.validator,
    ...(params.profileSubstep === undefined ? {} : { profileSubstep: params.profileSubstep }),
  })
}

export function validateRegisteredLocalYamlValue(
  params: LocalYamlValueValidationParams & { type: string }
): LocalYamlValueValidationResult {
  const registration = validators.get(params.type)
  if (registration === undefined) return { diagnostics: [] }

  const startedAt = performance.now()
  const diagnostics = registration.validator(params)
  return {
    diagnostics,
    ...(registration.profileSubstep === undefined
      ? {}
      : {
          profile: {
            substep: registration.profileSubstep,
            timeMs: performance.now() - startedAt,
          },
        }),
  }
}

export function snapshotLocalYamlValueValidationRegistryForTests(): LocalYamlValueValidationRegistrySnapshot {
  return { validators: new Map(validators) }
}

export function restoreLocalYamlValueValidationRegistryForTests(
  snapshot: LocalYamlValueValidationRegistrySnapshot
): void {
  validators.clear()
  for (const [type, registration] of snapshot.validators) validators.set(type, registration)
}
