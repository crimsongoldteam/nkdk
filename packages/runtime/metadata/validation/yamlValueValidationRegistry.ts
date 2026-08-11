import type { ParsedYaml } from "../../yaml/parseMetadataYaml"
import type { Diagnostic } from "./types"
import type { YamlPath } from "./yamlLocations"
import { currentValidationRegistrySet } from "./validationExecutionContext"

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

export function validateRegisteredLocalYamlValue(
  params: LocalYamlValueValidationParams & { type: string }
): LocalYamlValueValidationResult {
  const contextual = currentValidationRegistrySet<{
    validateLocalValue(
      input: LocalYamlValueValidationParams & { type: string },
    ): LocalYamlValueValidationResult
  }>()
  return contextual?.validateLocalValue(params) ?? { diagnostics: [] }
}
