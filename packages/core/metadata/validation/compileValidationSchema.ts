import type { TSchema } from "typebox"
import { compileTypeboxValidationSchema } from "./typeboxValidationCompiler"

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

export function compileValidationSchema<const Type extends TSchema>(
  schema: Type
): ValidationSchemaValidator
export function compileValidationSchema<Context extends SchemaContext, const Type extends TSchema>(
  context: Context,
  schema: Type
): ValidationSchemaValidator
export function compileValidationSchema(
  schemaOrContext: TSchema | SchemaContext,
  maybeSchema?: TSchema
): ValidationSchemaValidator {
  const context = maybeSchema === undefined ? {} : schemaOrContext as SchemaContext
  const schema = maybeSchema === undefined ? schemaOrContext as TSchema : maybeSchema
  return compileTypeboxValidationSchema(context, schema)
}
