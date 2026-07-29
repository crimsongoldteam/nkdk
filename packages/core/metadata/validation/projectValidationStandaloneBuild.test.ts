import { execFile } from "node:child_process"
import { existsSync } from "node:fs"
import { promisify } from "node:util"
import { describe, expect, it } from "vitest"
import { compileValidationSchema } from "./compileValidationSchema"
import { createProjectValidationStandaloneSchemaSet } from "./projectValidationStandaloneSchemas"
import { getValidationProjectSpecByDir } from "./projectSpecs"

const execFileAsync = promisify(execFile)

describe("project validation standalone build output", () => {
  it("includes refs produced by metadata collection registrations", () => {
    const schemaSet = createProjectValidationStandaloneSchemaSet()
    const ref = "nkdk://schema/validation/2.20/ru/MetadataCatalogAttribute"

    expect(schemaSet.refs[ref]).toMatchObject({
      type: "object",
    })
    const catalog = getValidationProjectSpecByDir("Справочник")
    if (catalog === undefined) throw new Error("Catalog validation spec is not registered")

    expect(JSON.stringify(schemaSet.byItemType[catalog.rule.itemType])).toContain(ref)
  })

  it("includes common form body schema in the validation graph", () => {
    const schemaSet = createProjectValidationStandaloneSchemaSet()
    const ref = "nkdk://schema/validation/2.20/ru/ClientApplicationForm"

    expect(schemaSet.refs[ref]).toMatchObject({
      type: "object",
    })
    const commonForm = getValidationProjectSpecByDir("ОбщаяФорма")
    if (commonForm === undefined) throw new Error("Common form validation spec is not registered")

    expect(JSON.stringify(schemaSet.byItemType[commonForm.rule.itemType])).toContain(ref)
  })

  it("accepts enumeration value names from YAML keys", () => {
    const schemaSet = createProjectValidationStandaloneSchemaSet()
    const enumeration = getValidationProjectSpecByDir("Перечисление")
    if (enumeration === undefined) throw new Error("Enumeration validation spec is not registered")
    const schema = compileValidationSchema(schemaSet.refs, schemaSet.byItemType[enumeration.rule.itemType])

    expect(schema.Check({ Значения: { Значение1: {} } })).toBe(true)
  })

  it("accepts predefined item codes from YAML keys", () => {
    const schemaSet = createProjectValidationStandaloneSchemaSet()
    const catalog = getValidationProjectSpecByDir("Справочник")
    if (catalog === undefined) throw new Error("Catalog validation spec is not registered")
    const schema = compileValidationSchema(schemaSet.refs, schemaSet.byItemType[catalog.rule.itemType])

    expect(schema.Check({ Предопределенные: { ПредопределенноеЗначение: { Наименование: "Предопределенное значение" } } })).toBe(
      true
    )
  })

  it("loads generated validators from dist when build has produced them", async () => {
    const modulePath = new URL("../../../dist/projectValidationAjvStandalone.js", import.meta.url).pathname
    if (!existsSync(modulePath)) return

    const script = [
      "const { pathToFileURL } = await import('node:url')",
      `const module = (await import(pathToFileURL(${JSON.stringify(modulePath)}).href)).default`,
      "console.log(JSON.stringify({",
      "  format: module.format,",
      "  context: module.context,",
      "  formValidateType: typeof module.form.validate,",
      "  formValidateResultType: typeof module.form.validate({}),",
      "  hasConfiguration: module.byItemType.MetadataConfiguration !== undefined,",
      "  hasConfigurationExtension: module.byItemType.MetadataConfigurationExtension !== undefined,",
      "}))",
    ].join(";")
    const { stdout } = await execFileAsync(process.execPath, ["-e", script])

    expect(JSON.parse(stdout)).toEqual({
      format: "project-validation-ajv-standalone-v2",
      context: {
        version: "2.20",
        defaultLanguage: "ru",
        exportToYAML: { toTyped: false },
      },
      formValidateType: "function",
      formValidateResultType: "boolean",
      hasConfiguration: true,
      hasConfigurationExtension: true,
    })
  })
})
