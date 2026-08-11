import type { TSchema } from "typebox"

export type SchemaContext = Record<string, TSchema>

export interface ValidationSchemaError {
  keyword: string
  schemaPath: string
  instancePath: string
  params: Record<string, unknown>
  message: string
}

export interface ValidationSchemaValidator {
  Check(value: unknown): boolean
  Errors(value: unknown): [boolean, ValidationSchemaError[]]
}
