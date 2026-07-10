import { execFile } from "node:child_process"
import { existsSync } from "node:fs"
import { promisify } from "node:util"
import { describe, expect, it } from "vitest"
import { compileValidationSchema } from "./compileValidationSchema"
import { createProjectValidationStandaloneSchemaSet } from "./projectValidationStandaloneSchemas"

const execFileAsync = promisify(execFile)

describe("project validation standalone build output", () => {
  it("includes refs produced by metadata collection registrations", () => {
    const schemaSet = createProjectValidationStandaloneSchemaSet()

    expect(schemaSet.refs["nkdk://schema/MetadataCatalogAttribute"]).toMatchObject({
      type: "object",
    })
    expect(JSON.stringify(schemaSet.byProjectDir["Справочник"])).toContain("nkdk://schema/MetadataCatalogAttribute")
  })

  it("accepts enumeration value names from YAML keys", () => {
    const schemaSet = createProjectValidationStandaloneSchemaSet()
    const schema = compileValidationSchema(schemaSet.refs, schemaSet.byProjectDir["Перечисление"])

    expect(schema.Check({ Значения: { Значение1: {} } })).toBe(true)
  })

  it("accepts predefined item codes from YAML keys", () => {
    const schemaSet = createProjectValidationStandaloneSchemaSet()
    const schema = compileValidationSchema(schemaSet.refs, schemaSet.byProjectDir["Справочник"])

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
      "  hasConfiguration: module.byProjectDir[''] !== undefined,",
      "}))",
    ].join(";")
    const { stdout } = await execFileAsync(process.execPath, ["-e", script])

    expect(JSON.parse(stdout)).toEqual({
      format: "project-validation-ajv-standalone-v1",
      context: {
        version: "2.20",
        defaultLanguage: "ru",
        exportToYAML: { toTyped: false },
      },
      formValidateType: "function",
      formValidateResultType: "boolean",
      hasConfiguration: true,
    })
  })
})
