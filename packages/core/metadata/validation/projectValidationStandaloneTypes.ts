import type { ValidateFunction } from "ajv"

export interface ProjectValidationStandaloneValidator {
  validate: ValidateFunction
}

export interface ProjectValidationStandaloneModule {
  format: "project-validation-ajv-standalone-v3"
  form: ProjectValidationStandaloneValidator
  byItemType: Record<string, ProjectValidationStandaloneValidator>
}
