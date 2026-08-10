import type {
  LocalYamlValueValidationParams,
  MetadataRulesDefinition,
} from "../ruleRuntime/definition"
import type {
  LocalYamlValueValidationProfile,
  LocalYamlValueValidationResult,
} from "./yamlValueValidationRegistry"
import {
  createProjectReferenceRegistrySet,
  type ProjectReferenceContribution,
  type ProjectReferenceRegistrySet,
} from "./projectReferenceIndexRegistry"
import { createDataPathRegistrySet, type DataPathContribution, type DataPathRegistrySet } from "./dataPath/registry"

export interface ValidationRegistrySet {
  readonly references: ProjectReferenceRegistrySet
  readonly dataPaths: DataPathRegistrySet
  validateLocalValue(
    params: LocalYamlValueValidationParams & { readonly type: string },
  ): LocalYamlValueValidationResult
}

export function createValidationRegistrySet(
  definition: Pick<
    MetadataRulesDefinition<never, ProjectReferenceContribution, DataPathContribution>,
    "validation" | "references" | "dataPaths"
  >,
): ValidationRegistrySet {
  const localYamlValidators = new Map(
    definition.validation.map((contribution) => [
      contribution.propertyType,
      contribution,
    ]),
  )

  return {
    references: createProjectReferenceRegistrySet(definition.references),
    dataPaths: createDataPathRegistrySet(definition.dataPaths),
    validateLocalValue(params) {
      const contribution = localYamlValidators.get(params.type)
      if (contribution === undefined) return { diagnostics: [] }

      const startedAt = performance.now()
      const diagnostics = [...contribution.validate(params)]
      const profile: LocalYamlValueValidationProfile | undefined =
        contribution.profileSubstep === undefined
          ? undefined
          : {
              substep: contribution.profileSubstep,
              timeMs: performance.now() - startedAt,
            }
      return {
        diagnostics,
        ...(profile === undefined ? {} : { profile }),
      }
    },
  }
}
