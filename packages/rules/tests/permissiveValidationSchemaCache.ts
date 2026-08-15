import type { ValidationSchemaCache } from "../metadata/validation/projectValidationPasses"

const validSchema = {
  Check: () => true,
  Errors: (): [boolean, []] => [true, []],
}

export const permissiveValidationSchemaCache: ValidationSchemaCache = {
  form: () => validSchema,
  properties: () => validSchema,
  compileAll: () => ({ formMs: 0, propertiesMs: 0, totalMs: 0 }),
}
