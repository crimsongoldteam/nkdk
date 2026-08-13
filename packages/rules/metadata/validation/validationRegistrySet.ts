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
import type { FormDataPathMetadataProjection } from "./formDataPathProjection"
import type { FormValidationAdapter } from "./formContracts"
import type {
  FormPlatformSourceMatcher,
  FormWarningProvider,
  RegisteredFormFirstPassValidator,
  RegisteredFormSecondPassValidator,
  RegisteredFormValidator,
} from "./formValidationRegistry"
import {
  emptyPropertyStateCapabilityRegistry,
  type PropertyStateCapabilityRegistry,
} from "../ruleRuntime/definition"

export interface ValidationRegistrySet {
  readonly propertyStates: PropertyStateCapabilityRegistry
  readonly rules: Pick<RuleRegistrySet, "execution" | "property">
  readonly references: ProjectReferenceRegistrySet
  readonly dataPaths: DataPathRegistrySet
  readonly execution: ObjectFieldIndexRuntime
  readonly form: {
    readonly structureProjection?: import("../ruleRuntime/definition").MetadataFormStructureProjection
    readonly validator?: RegisteredFormValidator
    readonly adapter?: FormValidationAdapter
    readonly passes?: {
      readonly firstPass: RegisteredFormFirstPassValidator
      readonly secondPass: RegisteredFormSecondPassValidator
    }
    readonly dataPathProjection?: FormDataPathMetadataProjection
    readonly platformSourceMatchers: readonly FormPlatformSourceMatcher[]
    readonly warningProviders: readonly FormWarningProvider[]
  }
  buildObjectFieldIndex(owner: Parameters<typeof buildObjectFieldIndex>[0]): ObjectFieldIndex
  validateLocalValue(
    params: LocalYamlValueValidationParams & { readonly type: string },
  ): LocalYamlValueValidationResult
}

export function createValidationRegistrySet(
  definition: Pick<
    MetadataRulesDefinition<never, ProjectReferenceContribution, DataPathContribution>,
    "validation" | "references" | "dataPaths" | "propertyStateCapabilities"
  >,
  rules: Pick<RuleRegistrySet, "execution" | "property">,
  propertyStates: PropertyStateCapabilityRegistry = emptyPropertyStateCapabilityRegistry,
): ValidationRegistrySet {
  const localYamlValidators = new Map(
    definition.validation.filter((contribution) => contribution.kind === "localYamlValue").map((contribution) => [
      contribution.propertyType,
      contribution,
    ]),
  )
  const formValidator = definition.validation.find((contribution) => contribution.kind === "formValidator")?.validator
  const formAdapter = definition.validation.find((contribution) => contribution.kind === "formValidationAdapter")?.adapter
  const formPasses = definition.validation.find((contribution) => contribution.kind === "formValidationPasses")
  const dataPathProjection = definition.validation.find((contribution) => contribution.kind === "formDataPathProjection")?.projection
  const platformSourceMatchers = definition.validation
    .filter((contribution) => contribution.kind === "formPlatformSourceMatcher")
    .map((contribution) => contribution.matcher)
  const warningProviders = definition.validation
    .filter((contribution) => contribution.kind === "formWarningProvider")
    .map((contribution) => contribution.provider)
  const structureProjection = definition.validation.find(
    (contribution) => contribution.kind === "formStructureProjection",
  )?.projection

  const dataPaths = createDataPathRegistrySet(definition.dataPaths)
  const execution = { dataPaths, execution: rules.execution }
  return {
    propertyStates,
    rules,
    references: createProjectReferenceRegistrySet(definition.references),
    dataPaths,
    execution,
    form: {
      ...(structureProjection === undefined ? {} : { structureProjection }),
      ...(formValidator === undefined ? {} : { validator: formValidator }),
      ...(formAdapter === undefined ? {} : { adapter: formAdapter }),
      ...(formPasses === undefined ? {} : {
        passes: { firstPass: formPasses.firstPass, secondPass: formPasses.secondPass },
      }),
      ...(dataPathProjection === undefined ? {} : { dataPathProjection }),
      platformSourceMatchers,
      warningProviders,
    },
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
