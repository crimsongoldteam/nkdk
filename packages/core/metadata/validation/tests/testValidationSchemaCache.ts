import { Type } from "typebox"
import { compileValidationSchema } from "../compileValidationSchema"
import type { ValidationSchemaCache } from "../projectValidationPasses"

export function createTestValidationSchemaCache(): ValidationSchemaCache {
  const formBody = Type.Object({
    Элементы: Type.Optional(Type.Record(Type.String(), Type.Any())),
  }, { additionalProperties: true })
  const form = compileValidationSchema(formBody)
  const commonForm = compileValidationSchema(Type.Object({
    Форма: Type.Optional(formBody),
  }, { additionalProperties: true }))
  const catalog = compileValidationSchema(Type.Object({}, { additionalProperties: false }))
  const permissive = compileValidationSchema(Type.Any())

  return {
    form: () => form,
    properties: (rule) => {
      if (rule.itemType === "MetadataCommonForm") return commonForm
      if (rule.itemType === "MetadataCatalog") return catalog
      return permissive
    },
    compileAll: () => ({ formMs: 0, propertiesMs: 0, totalMs: 0 }),
  }
}
