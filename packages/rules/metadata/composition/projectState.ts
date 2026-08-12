import { createPreparedYamlProjectRefreshExecutor, createPreparedYamlProjectWorkerPool } from "../project/preparedYamlProjectWorkerPool"
import { createProjectStateDependencyValidator } from "../validation/projectStateDependencyValidation"
import { createMetadataWorkerPoolHandle } from "../workerPool/handle"
import { openBinaryProjectStateReadSession } from "../projectState/binary/readSession"
import type { ProjectStateReadToken } from "../projectState/contracts"
import { createProjectStateWriterHandle } from "../projectState/writerHandle"
import {
  createProjectStateService,
  type CreateProjectStateServiceOptions,
  type ProjectStateService,
} from "../projectState/service"
import { validateBorrowedClientApplicationForms } from "../forms/clientApplicationForm/borrowedFormValidation"
import { validateConfigurationExtensionPropertyStates } from "../appliedObjects/configurationExtension/propertyStateValidation"
import { validateConfigurationExtensionStructure } from "../appliedObjects/configurationExtension/structureValidation"
import { validateConfigurationExtensionHistory } from "../appliedObjects/configurationExtension/historyValidation"
import { appliedObjectComponentRules } from "../appliedObjects/componentRules"
import { compileMetadataResourceTopologyForRootRule } from "../resourceTopology/adapters/ruleTopology"
import { createValidationRulesSnapshot } from "../validation/rulesSnapshot"
import type { RuleRegistrySet } from "../ruleRuntime/ruleRegistrySet"
import { currentRuleRegistrySet } from "@nkdk/runtime/rule-kit"

function dependencyValidator() {
  return createProjectStateDependencyValidator({
    structuredDocumentValidators: [
      validateBorrowedClientApplicationForms,
      validateConfigurationExtensionPropertyStates,
      validateConfigurationExtensionStructure,
      validateConfigurationExtensionHistory,
    ],
  })
}

export const openProjectStateReadSession = (token: ProjectStateReadToken) =>
  openBinaryProjectStateReadSession(token, dependencyValidator())

export function createDefaultProjectStateService(
  options: CreateProjectStateServiceOptions = {},
  rules?: RuleRegistrySet,
): ProjectStateService {
  const effectiveRules = rules ?? currentRuleRegistrySet<RuleRegistrySet>()
  const workers = options.workerPool ?? createMetadataWorkerPoolHandle()
  const validator = dependencyValidator()
  return createProjectStateService({
    ...options,
    workerPool: workers,
    useWorkerOperation: options.createPool === undefined ? true : options.useWorkerOperation,
    createWriter: options.createWriter ?? (() => createProjectStateWriterHandle({ dependencyValidator: validator })),
    openReadSession: options.openReadSession ?? openProjectStateReadSession,
    createPool: options.createPool ?? ((concurrency, operation, context) => {
      if (operation === undefined || context === undefined) {
        throw new Error("ProjectState refresh composition is incomplete")
      }
      const pool = createPreparedYamlProjectWorkerPool({
        concurrency,
        operation,
        createRulesSnapshot: (validationContext) =>
          createValidationRulesSnapshot(
            validationContext,
            effectiveRules === undefined
              ? appliedObjectComponentRules.components.map(({ rootRule }) =>
                  compileMetadataResourceTopologyForRootRule(rootRule, []))
              : [...effectiveRules.components.values()].map(({ rootRule }) =>
                  effectiveRules.resourceTopology.get(rootRule)),
            effectiveRules,
          ),
      })
      const executor = createPreparedYamlProjectRefreshExecutor(pool, context)
      return {
        ...executor,
        initValidation: (validationContext) => pool.initValidation(validationContext),
      }
    }),
  })
}
