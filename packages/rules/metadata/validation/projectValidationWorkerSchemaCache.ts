import type { ConfigurationContext } from "@nkdk/runtime"
import {
  createValidationSchemaCache,
  type ValidationSchemaCache,
} from "./projectValidationPasses"

export async function createProjectValidationWorkerSchemaCache(params: {
  context: ConfigurationContext
}): Promise<ValidationSchemaCache> {
  const cache = createValidationSchemaCache(params.context)
  cache.compileAll()
  return cache
}
