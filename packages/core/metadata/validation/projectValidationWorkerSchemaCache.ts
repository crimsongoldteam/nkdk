import { existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import type { ConfigurationContext } from "../context/types"
import {
  createValidationSchemaCache,
  type ValidationSchemaCache,
} from "./projectValidationPasses"
import { loadProjectValidationStandaloneCache } from "./projectValidationStandaloneLoader"

export async function createProjectValidationWorkerSchemaCache(params: {
  context: ConfigurationContext
  workerUrl?: string
}): Promise<ValidationSchemaCache> {
  const workerUrl = params.workerUrl ?? import.meta.url
  if (workerUrl.endsWith(".ts")) {
    return createValidationSchemaCache(params.context)
  }

  const modulePath = join(dirname(fileURLToPath(workerUrl)), "projectValidationAjvStandalone.js")
  if (!existsSync(modulePath)) {
    throw new Error(`Standalone validation schema module was not found next to worker: ${modulePath}`)
  }

  return loadProjectValidationStandaloneCache({
    modulePath,
    context: params.context,
  })
}
