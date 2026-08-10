import { createOperationRegistrySet } from "../operations/operationRegistrySet"
import { validateProject } from "../project/validateProject"
import { createProjectStateService } from "../projectState/service"
import { createRuleRegistrySet } from "../ruleRuntime/ruleRegistrySet"
import { createValidationRegistrySet } from "../validation/validationRegistrySet"
import type {
  CreateMetadataRuntimeOptions,
  MetadataRuntime,
} from "./contracts"

export function createMetadataRuntime(
  options: CreateMetadataRuntimeOptions,
): MetadataRuntime {
  const rules = createRuleRegistrySet(options.rules)
  const validation = createValidationRegistrySet(options.rules)
  const operations = createOperationRegistrySet(options.rules)
  const ownedStates = new WeakSet<object>()
  const openStates = new Set<ReturnType<typeof createProjectStateService>>()
  let closed = false
  let closePromise: Promise<void> | undefined

  const assertOpen = () => {
    if (closed) throw new Error("Metadata runtime закрыт")
  }

  return {
    projects: {
      specs: rules.projectSpecs,
      createState() {
        assertOpen()
        const state = createProjectStateService()
        ownedStates.add(state)
        openStates.add(state)
        return state
      },
    },
    schemas: rules.schemas,
    validation: {
      ...validation,
      async validateProject(params) {
        assertOpen()
        if (!ownedStates.has(params.projectState)) {
          throw new Error("ProjectStateService принадлежит другому runtime")
        }
        return validateProject(params)
      },
    },
    metadata: { rules, operations },
    close() {
      if (closePromise !== undefined) return closePromise
      closed = true
      closePromise = Promise.all([...openStates].map((state) => state.close())).then(
        () => {
          openStates.clear()
        },
      )
      return closePromise
    },
  }
}
