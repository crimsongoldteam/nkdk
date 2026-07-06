import type { ValidateFunction } from "ajv"
import type { TSchema } from "typebox"
import type { ConfigurationContext } from "../context/types"

export interface ProjectValidationStandaloneValidator {
  schema: TSchema
  validate: ValidateFunction
}

export interface ProjectValidationStandaloneModule {
  format: "project-validation-ajv-standalone-v1"
  context: ConfigurationContext
  refs?: Record<string, TSchema>
  form: ProjectValidationStandaloneValidator
  byProjectDir: Record<string, ProjectValidationStandaloneValidator>
}
