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
import type { RuleRegistrySet } from "../ruleRuntime/ruleRegistrySet"
import {
  buildObjectFieldIndex,
  type ObjectFieldIndexRuntime,
} from "./dataPath/objectFields"
import type { ObjectFieldIndex } from "./dataPath/contracts"

export interface ValidationRegistrySet {
  readonly rules: Pick<RuleRegistrySet, "execution">
  readonly references: ProjectReferenceRegistrySet
  readonly dataPaths: DataPathRegistrySet
  readonly execution: ObjectFieldIndexRuntime
  buildObjectFieldIndex(owner: Parameters<typeof buildObjectFieldIndex>[0]): ObjectFieldIndex
  validateLocalValue(
    params: LocalYamlValueValidationParams & { readonly type: string },
  ): LocalYamlValueValidationResult
}

export function createValidationRegistrySet(
  definition: Pick<
    MetadataRulesDefinition<never, ProjectReferenceContribution, DataPathContribution>,
    "validation" | "references" | "dataPaths"
  >,
  rules: Pick<RuleRegistrySet, "execution">,
): ValidationRegistrySet {
  const localYamlValidators = new Map(
    definition.validation.map((contribution) => [
      contribution.propertyType,
      contribution,
    ]),
  )

  const dataPaths = createDataPathRegistrySet(definition.dataPaths)
  const execution = { dataPaths, execution: rules.execution }
  return {
    rules,
    references: createProjectReferenceRegistrySet(definition.references),
    dataPaths,
    execution,
    buildObjectFieldIndex: (owner) => buildObjectFieldIndex(owner, execution),
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
