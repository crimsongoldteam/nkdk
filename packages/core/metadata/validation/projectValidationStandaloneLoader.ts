import { performance } from "node:perf_hooks"
import { pathToFileURL } from "node:url"
import { getMetadataComponentDescriptor } from "../components/descriptor"
import type { MetadataItemRule } from "../orchestration/property/types"
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
import type {
  ProjectValidationStandaloneModule,
  ProjectValidationStandaloneValidator,
} from "./projectValidationStandaloneTypes"

export function createValidationSchemaCacheFromStandaloneModule(
  module: ProjectValidationStandaloneModule
): ValidationSchemaCache {
  assertProjectValidationStandaloneModule(module)

  const form = createCompiledStandaloneValidator(module.form)
  const properties = new Map<string, ValidationSchemaValidator>()

  return {
    form() {
      return form
    },
    properties(rule) {
      const existing = properties.get(rule.itemType)
      if (existing !== undefined) return existing

      const validator = module.byItemType[rule.itemType]
      if (validator === undefined) {
        throw new Error(`Standalone validation schema was not generated for item type "${rule.itemType}"`)
      }

      const compiled = createCompiledStandaloneValidator(validator)
      properties.set(rule.itemType, compiled)
      return compiled
    },
    compileAll(): ValidationSchemaCacheCompileProfile {
      const startedAt = performance.now()
      const formStartedAt = performance.now()
      this.form()
      const formMs = performance.now() - formStartedAt

      const propertiesStartedAt = performance.now()
      for (const rule of validationProjectPropertyRules()) {
        this.properties(rule)
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
}): Promise<ValidationSchemaCache> {
  const loaded = (await import(pathToFileURL(params.modulePath).href)) as {
    default?: ProjectValidationStandaloneModule
  } & Partial<ProjectValidationStandaloneModule>
  const module = loaded.default ?? loaded

  return createValidationSchemaCacheFromStandaloneModule(module as ProjectValidationStandaloneModule)
}

function createCompiledStandaloneValidator(
  validator: ProjectValidationStandaloneValidator
): ValidationSchemaValidator {
  return createValidationSchemaFromAjvFunction(validator.validate)
}

function assertProjectValidationStandaloneModule(module: ProjectValidationStandaloneModule): void {
  if (module.format !== "project-validation-ajv-standalone-v3") {
    throw new Error(`Unsupported standalone validation module format: ${String(module.format)}`)
  }
}

function validationProjectPropertyRules(): MetadataItemRule[] {
  return uniqueRulesByItemType([
    configurationValidationProjectSpec.rule,
    getMetadataComponentDescriptor("configurationExtension").rootRule,
    ...validationProjectSpecs.map((spec) => spec.rule),
  ])
}

function uniqueRulesByItemType(rules: readonly MetadataItemRule[]): MetadataItemRule[] {
  return [...new Map(rules.map((rule) => [rule.itemType, rule])).values()]
}
