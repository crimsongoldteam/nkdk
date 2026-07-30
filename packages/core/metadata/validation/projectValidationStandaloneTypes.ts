import type { ValidateFunction } from "ajv"

export interface ProjectValidationStandaloneValidator {
  validate: ValidateFunction
}

export type ProjectValidationStandaloneModule =
  | {
      format: "project-validation-ajv-standalone-v3"
      form: ProjectValidationStandaloneValidator
      byItemType: Record<string, ProjectValidationStandaloneValidator>
    }
  | {
      format: "project-validation-ajv-standalone-v4"
      forms: Record<string, ProjectValidationStandaloneValidator>
      byItemType: Record<string, ProjectValidationStandaloneValidator>
    }
