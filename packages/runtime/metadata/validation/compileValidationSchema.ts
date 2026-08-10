import type { TSchema } from "typebox"
import { compileTypeboxValidationSchema } from "./typeboxValidationCompiler"
import type { SchemaContext, ValidationSchemaValidator } from "./validationSchema"

export type { SchemaContext, ValidationSchemaError, ValidationSchemaValidator } from "./validationSchema"

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
