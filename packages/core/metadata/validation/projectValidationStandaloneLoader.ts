import { performance } from "node:perf_hooks"
import { pathToFileURL } from "node:url"
import type { ConfigurationContext } from "../context/types"
import {
  createValidationSchemaFromAjvFunction,
  type ValidationSchemaValidator,
} from "./compileValidationSchema"
import {
  configurationValidationProjectSpec,
  validationProjectSpecs,
} from "./projectSpecs"
import type {
  ValidationSchemaCache,
  ValidationSchemaCacheCompileProfile,
} from "./projectValidationPasses"
import { assertStandaloneValidationContext } from "./projectValidationStandaloneSchemas"
import type {
  ProjectValidationStandaloneModule,
  ProjectValidationStandaloneValidator,
} from "./projectValidationStandaloneTypes"

export function createValidationSchemaCacheFromStandaloneModule(
  module: ProjectValidationStandaloneModule,
  context: ConfigurationContext = module.context
): ValidationSchemaCache {
  assertProjectValidationStandaloneModule(module)
  assertStandaloneValidationContext(module.context, context)

  const schemaContext = module.refs ?? {}
  const form = createCompiledStandaloneValidator(module.form, schemaContext)
  const properties = new Map<string, ValidationSchemaValidator>()

  return {
    form() {
      return form
    },
    properties(spec) {
      const existing = properties.get(spec.dir)
      if (existing !== undefined) return existing

      const validator = module.byProjectDir[spec.dir]
      if (validator === undefined) {
        throw new Error(`Standalone validation schema was not generated for project dir "${spec.dir}"`)
      }

      const compiled = createCompiledStandaloneValidator(validator, schemaContext)
      properties.set(spec.dir, compiled)
      return compiled
    },
    compileAll(): ValidationSchemaCacheCompileProfile {
      const startedAt = performance.now()
      const formStartedAt = performance.now()
      this.form()
      const formMs = performance.now() - formStartedAt

      const propertiesStartedAt = performance.now()
      this.properties(configurationValidationProjectSpec)
      for (const spec of validationProjectSpecs) {
        this.properties(spec)
      }
      const propertiesMs = performance.now() - propertiesStartedAt

      return {
        formMs,
        propertiesMs,
        totalMs: performance.now() - startedAt,
      }
    },
  }
}

export async function loadProjectValidationStandaloneCache(params: {
  modulePath: string
  context: ConfigurationContext
}): Promise<ValidationSchemaCache> {
  const loaded = (await import(pathToFileURL(params.modulePath).href)) as {
    default?: ProjectValidationStandaloneModule
  } & Partial<ProjectValidationStandaloneModule>
  const module = loaded.default ?? loaded

  return createValidationSchemaCacheFromStandaloneModule(module as ProjectValidationStandaloneModule, params.context)
}

function createCompiledStandaloneValidator(
  validator: ProjectValidationStandaloneValidator,
  context: NonNullable<ProjectValidationStandaloneModule["refs"]>
): ValidationSchemaValidator {
  return createValidationSchemaFromAjvFunction({
    schema: validator.schema,
    context,
    validate: validator.validate,
  })
}

function assertProjectValidationStandaloneModule(module: ProjectValidationStandaloneModule): void {
  if (module.format !== "project-validation-ajv-standalone-v1") {
    throw new Error(`Unsupported standalone validation module format: ${String(module.format)}`)
  }
}
