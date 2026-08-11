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
import { appliedObjectComponentRules } from "../appliedObjects/componentRules"
import { compileMetadataResourceTopologyForRootRule } from "../resourceTopology/adapters/ruleTopology"
import {
  configurationValidationProjectSpec,
  validationProjectSpecs,
} from "../validation/projectSpecs"
import { createValidationRulesSnapshot } from "../validation/rulesSnapshot"

const validationSpecs = [configurationValidationProjectSpec, ...validationProjectSpecs]
const validationTopologies = appliedObjectComponentRules.components.map(({ rootRule }) =>
  compileMetadataResourceTopologyForRootRule(rootRule, validationSpecs)
)

function dependencyValidator() {
  return createProjectStateDependencyValidator({
    structuredDocumentValidators: [validateBorrowedClientApplicationForms],
  })
}

export const openProjectStateReadSession = (token: ProjectStateReadToken) =>
  openBinaryProjectStateReadSession(token, dependencyValidator())

export function createDefaultProjectStateService(
  options: CreateProjectStateServiceOptions = {},
): ProjectStateService {
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
          createValidationRulesSnapshot(validationContext, validationTopologies),
      })
      const executor = createPreparedYamlProjectRefreshExecutor(pool, context)
      return {
        ...executor,
        initValidation: (validationContext) => pool.initValidation(validationContext),
      }
    }),
  })
}
