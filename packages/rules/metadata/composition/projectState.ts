import { createPreparedYamlProjectRefreshExecutor, createPreparedYamlProjectWorkerPool } from "../project/preparedYamlProjectWorkerPool"
import { createProjectStateDependencyValidator } from "../validation/projectStateDependencyValidation"
import { createMetadataWorkerPoolHandle } from "../workerPool/handle"
import type { ProjectStateReadToken } from "../projectState/contracts"
import { createProjectStateWriterHandle } from "../projectState/writerHandle"
import { loadBinaryProjectState } from "../projectState/binary/persistence"
import {
  createProjectStateService,
  type CreateProjectStateServiceOptions,
  type ProjectStateService,
} from "../projectState/service"
import { validateBorrowedClientApplicationForms } from "../forms/clientApplicationForm/borrowedFormValidation"
import { appliedObjectComponentRules } from "../appliedObjects/componentRules"
import { compileMetadataResourceTopologyForRootRule } from "../resourceTopology/adapters/ruleTopology"
import { createValidationRulesSnapshot } from "../validation/rulesSnapshot"
import type { RuleRegistrySet } from "../ruleRuntime/ruleRegistrySet"
import { currentRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import { createProjectStateBackend } from "./projectStateBackend"

function dependencyValidator() {
  return createProjectStateDependencyValidator({
    structuredDocumentValidators: [validateBorrowedClientApplicationForms],
  })
}

export const openProjectStateReadSession = (token: ProjectStateReadToken) =>
  createProjectStateBackend().openReadSession(token, dependencyValidator())

export function createDefaultProjectStateService(
  options: CreateProjectStateServiceOptions = {},
  rules?: RuleRegistrySet,
): ProjectStateService {
  const effectiveRules = rules ?? currentRuleRegistrySet<RuleRegistrySet>()
  const workers = options.workerPool ?? createMetadataWorkerPoolHandle()
  const validator = dependencyValidator()
  const backend = createProjectStateBackend()
  return createProjectStateService({
    ...options,
    workerPool: workers,
    useWorkerOperation: options.createPool === undefined ? true : options.useWorkerOperation,
    createWriter: options.createWriter ?? (() => createProjectStateWriterHandle({
      dependencyValidator: validator,
      openStore: async (projectDir) => backend.openStore({
        projectDir,
        initial: await loadBinaryProjectState(projectDir),
        dependencyValidator: validator,
      }),
    })),
    openReadSession: options.openReadSession ?? ((token) => backend.openReadSession(token, validator)),
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
