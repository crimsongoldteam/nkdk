import type { ValidateFunction } from "ajv"
import { describe, expect, it } from "vitest"
import { MetadataConfigurationExtensionRules } from "../appliedObjects/configurationExtension/rules"
import type { MetadataItemRule } from "../ruleRuntime/property/types"
import { createValidationSchemaCacheFromStandaloneModule } from "./projectValidationStandaloneLoader"
import {
  configurationValidationProjectSpec,
  validationProjectSpecs,
} from "./projectSpecs"
import type { ProjectValidationStandaloneModule } from "./projectValidationStandaloneTypes"
import { compileRegisteredMetadataResourceTopology } from "../resourceTopology/registry"
import {
  ClientApplicationFormRules,
  ClientApplicationFormWithExtendedPresentationRules,
} from "../forms/clientApplicationForm/rules"
import { MetadataExternalDataSourceTableRules } from "../commonObjects/metadataExternalDataSourceTable/rules"
import { projectValidationFormRuleKey } from "./projectValidationFormRules"

const catalogRule = { itemType: "MetadataCatalog", properties: {} } as MetadataItemRule

describe("project validation standalone loader", () => {
  it("регистрирует схему каждого YAML fileItem, а не только прикладной формы", () => {
    const assignment = compileRegisteredMetadataResourceTopology().assignments.find(
      ({ role, itemRule }) => role === "fileItem" && itemRule === MetadataExternalDataSourceTableRules,
    )
    if (assignment === undefined) throw new Error("Не найдена таблица внешнего источника данных")

    expect(projectValidationFormRuleKey(MetadataExternalDataSourceTableRules)).toBe(assignment.id)
  })

  it("selects standalone form validators by topology rule", () => {
    const topology = compileRegisteredMetadataResourceTopology()
    const baseNode = topology.assignments.find(
      ({ role, itemRule }) =>
        role === "fileItem" && itemRule === ClientApplicationFormRules
    )
    const specializedNode = topology.assignments.find(
      ({ role, itemRule }) =>
        role === "fileItem" &&
        itemRule ===
          ClientApplicationFormWithExtendedPresentationRules
    )
    if (baseNode === undefined || specializedNode === undefined) {
      throw new Error("Не найдены варианты правил форм")
    }
    const cache = createValidationSchemaCacheFromStandaloneModule({
      format: "project-validation-ajv-standalone-v4",
      forms: {
        [baseNode.id]: {
          validate: validWhenHasString("БазовоеПоле"),
        },
        [specializedNode.id]: {
          validate: validWhenHasString("РасширенноеПредставление"),
        },
      },
      byItemType: {},
    })

    expect(
      cache
        .form(ClientApplicationFormWithExtendedPresentationRules)
        .Check({ РасширенноеПредставление: "Продажи" })
    ).toBe(true)
    expect(
      cache
        .form(ClientApplicationFormRules)
        .Check({ РасширенноеПредставление: "Продажи" })
    ).toBe(false)
  })

  it("creates form and properties validators from a standalone-like module", () => {
    const formValidate = validWhenHasString("Вид")
    const propertiesValidate = validWhenHasString("Имя")
    const cache = createValidationSchemaCacheFromStandaloneModule({
      format: "project-validation-ajv-standalone-v3",
      form: { validate: formValidate },
      byItemType: {
        MetadataCatalog: { validate: propertiesValidate },
      },
    })

    expect(cache.form(ClientApplicationFormRules).Check({ Вид: "Форма" })).toBe(true)
    expect(cache.form(ClientApplicationFormRules).Check({})).toBe(false)
    expect(cache.properties(catalogRule).Check({ Имя: "Номенклатура" })).toBe(true)
    expect(cache.properties(catalogRule).Check({})).toBe(false)
  })

  it("rejects obsolete standalone formats", () => {
    expect(() =>
      createValidationSchemaCacheFromStandaloneModule({
        format: "project-validation-ajv-standalone-v2",
      } as never)
    ).toThrow("Unsupported standalone validation module format")
  })

  it("compileAll eagerly checks every root rule including configuration extension", () => {
    const module = {
      format: "project-validation-ajv-standalone-v3",
      form: { validate: validAny() },
      byItemType: Object.fromEntries(
        [configurationValidationProjectSpec.rule, ...validationProjectSpecs.map((spec) => spec.rule)].map((rule) => [
          rule.itemType,
          { validate: validAny() },
        ])
      ),
    } satisfies ProjectValidationStandaloneModule

    const cache = createValidationSchemaCacheFromStandaloneModule(module)

    expect(() => cache.compileAll()).toThrow(
      'Standalone validation schema was not generated for item type "MetadataConfigurationExtension"'
    )

    module.byItemType[MetadataConfigurationExtensionRules.itemType] = { validate: validAny() }

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
