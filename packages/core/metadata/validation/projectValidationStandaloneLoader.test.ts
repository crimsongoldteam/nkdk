import type { ValidateFunction } from "ajv"
import { describe, expect, it } from "vitest"
import { Type } from "typebox"
import { createValidationSchemaCacheFromStandaloneModule } from "./projectValidationStandaloneLoader"
import {
  configurationValidationProjectSpec,
  validationProjectSpecs,
  type ValidationProjectSpec,
} from "./projectSpecs"
import type { ProjectValidationStandaloneModule } from "./projectValidationStandaloneTypes"

describe("project validation standalone loader", () => {
  it("creates form and properties validators from a standalone-like module", () => {
    const formSchema = Type.Object({ Вид: Type.String() })
    const propertiesSchema = Type.Object({ Имя: Type.String() })
    const formValidate = validWhenHasString("Вид")
    const propertiesValidate = validWhenHasString("Имя")
    const cache = createValidationSchemaCacheFromStandaloneModule({
      format: "project-validation-ajv-standalone-v1",
      context: {
        version: "2.20",
        defaultLanguage: "ru",
        exportToYAML: { toTyped: false },
      },
      form: { schema: formSchema, validate: formValidate },
      byProjectDir: {
        Справочник: { schema: propertiesSchema, validate: propertiesValidate },
      },
    })

    expect(cache.form().Check({ Вид: "Форма" })).toBe(true)
    expect(cache.form().Check({})).toBe(false)
    expect(cache.properties({ dir: "Справочник" } as ValidationProjectSpec).Check({ Имя: "Номенклатура" })).toBe(true)
    expect(cache.properties({ dir: "Справочник" } as ValidationProjectSpec).Check({})).toBe(false)
  })

  it("rejects unsupported context instead of silently using wrong schemas", () => {
    const module = {
      format: "project-validation-ajv-standalone-v1",
      context: {
        version: "2.20",
        defaultLanguage: "ru",
        exportToYAML: { toTyped: false },
      },
      form: { schema: Type.Any(), validate: validWhenHasString("Вид") },
      byProjectDir: {},
    } satisfies ProjectValidationStandaloneModule

    expect(() =>
      createValidationSchemaCacheFromStandaloneModule(module, {
        version: "2.21",
        defaultLanguage: "ru",
        exportToYAML: { toTyped: false },
      })
    ).toThrow("Standalone validation schemas were built for context")
  })

  it("compileAll eagerly checks every project dir including configuration", () => {
    const module = {
      format: "project-validation-ajv-standalone-v1",
      context: {
        version: "2.20",
        defaultLanguage: "ru",
        exportToYAML: { toTyped: false },
      },
      form: { schema: Type.Any(), validate: validAny() },
      byProjectDir: Object.fromEntries(
        validationProjectSpecs.map((spec) => [spec.dir, { schema: Type.Any(), validate: validAny() }])
      ),
    } satisfies ProjectValidationStandaloneModule

    const cache = createValidationSchemaCacheFromStandaloneModule(module)

    expect(() => cache.compileAll()).toThrow('Standalone validation schema was not generated for project dir ""')

    module.byProjectDir[configurationValidationProjectSpec.dir] = { schema: Type.Any(), validate: validAny() }

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

  return validate as ValidateFunction
}

function validAny(): ValidateFunction {
  const validate = Object.assign(() => true, { errors: null as ValidateFunction["errors"] })
  return validate as ValidateFunction
}
