import type { ConfigurationContext } from "@nkdk/runtime"
import {
  createValidationSchemaCache,
  type ValidationSchemaCache,
} from "./projectValidationPasses"

export async function createProjectValidationWorkerSchemaCache(params: {
  context: ConfigurationContext
}, dependencies: {
  createCache?: typeof createValidationSchemaCache
} = {}): Promise<ValidationSchemaCache> {
  return (dependencies.createCache ?? createValidationSchemaCache)(params.context)
}
