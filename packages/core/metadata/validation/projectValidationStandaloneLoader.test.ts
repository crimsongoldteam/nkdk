import type { ValidateFunction } from "ajv"
import { describe, expect, it } from "vitest"
import { Type } from "typebox"
import { MetadataConfigurationExtensionRules } from "../appliedObjects/configurationExtension/rules"
import type { MetadataItemRule } from "../orchestration/property/types"
import { createValidationSchemaCacheFromStandaloneModule } from "./projectValidationStandaloneLoader"
import {
  configurationValidationProjectSpec,
  validationProjectSpecs,
} from "./projectSpecs"
import type { ProjectValidationStandaloneModule } from "./projectValidationStandaloneTypes"

const catalogRule = { itemType: "MetadataCatalog", properties: {} } as MetadataItemRule

describe("project validation standalone loader", () => {
  it("creates form and properties validators from a standalone-like module", () => {
    const formValidate = validWhenHasString("Вид")
    const propertiesValidate = validWhenHasString("Имя")
    const cache = createValidationSchemaCacheFromStandaloneModule({
      format: "project-validation-ajv-standalone-v2",
      context: {
        version: "2.20",
        defaultLanguage: "ru",
        exportToYAML: { toTyped: false },
      },
      form: { validate: formValidate },
      byItemType: {
        MetadataCatalog: { validate: propertiesValidate },
      },
    })

    expect(cache.form().Check({ Вид: "Форма" })).toBe(true)
    expect(cache.form().Check({})).toBe(false)
    expect(cache.properties(catalogRule).Check({ Имя: "Номенклатура" })).toBe(true)
    expect(cache.properties(catalogRule).Check({})).toBe(false)
  })

  it("rejects unsupported context instead of silently using wrong schemas", () => {
    const module = {
      format: "project-validation-ajv-standalone-v2",
      context: {
        version: "2.20",
        defaultLanguage: "ru",
        exportToYAML: { toTyped: false },
      },
      form: { schema: Type.Any(), validate: validWhenHasString("Вид") },
      byItemType: {},
    } satisfies ProjectValidationStandaloneModule

    expect(() =>
      createValidationSchemaCacheFromStandaloneModule(module, {
        version: "2.21",
        defaultLanguage: "ru",
        exportToYAML: { toTyped: false },
      })
    ).toThrow("Standalone validation schemas were built for context")
  })

  it("compileAll eagerly checks every root rule including configuration extension", () => {
    const module = {
      format: "project-validation-ajv-standalone-v2",
      context: {
        version: "2.20",
        defaultLanguage: "ru",
        exportToYAML: { toTyped: false },
      },
      form: { schema: Type.Any(), validate: validAny() },
      byItemType: Object.fromEntries(
        [configurationValidationProjectSpec.rule, ...validationProjectSpecs.map((spec) => spec.rule)].map((rule) => [
          rule.itemType,
          { schema: Type.Any(), validate: validAny() },
        ])
      ),
    } satisfies ProjectValidationStandaloneModule

    const cache = createValidationSchemaCacheFromStandaloneModule(module)

    expect(() => cache.compileAll()).toThrow(
      'Standalone validation schema was not generated for item type "MetadataConfigurationExtension"'
    )

    module.byItemType[MetadataConfigurationExtensionRules.itemType] = { schema: Type.Any(), validate: validAny() }

    expect(cache.compileAll()).toEqual({
      formMs: expect.any(Number),
      propertiesMs: expect.any(Number),
      totalMs: expect.any(Number),
    })
  })
})

function validWhenHasString(key: string): ValidateFunction {
  const validate = Object.assign(
    (value: unknown) => {
      const valid =
        typeof value === "object" && value !== null && typeof (value as Record<string, unknown>)[key] === "string"
      validate.errors = valid
        ? null
        : [
            {
              keyword: "required",
              instancePath: "",
              schemaPath: "#/required",
              params: { missingProperty: key },
              message: `must have required property '${key}'`,
            },
          ]
      return valid
    },
    { errors: null as ValidateFunction["errors"] }
  )

  return asValidateFunction(validate)
}

function validAny(): ValidateFunction {
  const validate = Object.assign(() => true, { errors: null as ValidateFunction["errors"] })
  return asValidateFunction(validate)
}

function asValidateFunction(
  validate: ((value: unknown) => boolean) & { errors: ValidateFunction["errors"] }
): ValidateFunction {
  return validate as unknown as ValidateFunction
}
