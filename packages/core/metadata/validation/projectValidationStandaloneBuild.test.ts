import { execFile } from "node:child_process"
import { existsSync } from "node:fs"
import { promisify } from "node:util"
import { beforeAll, describe, expect, it } from "vitest"

const execFileAsync = promisify(execFile)

describe("project validation standalone build output", () => {
  let generatedValidatorsSummary: unknown

  beforeAll(async () => {
    const modulePath = new URL("../../dist/projectValidationAjvStandalone.js", import.meta.url).pathname
    if (!existsSync(modulePath)) return

    const script = [
      "const { pathToFileURL } = await import('node:url')",
      `const module = (await import(pathToFileURL(${JSON.stringify(modulePath)}).href)).default`,
      "const form = Object.values(module.forms)[0]",
      "console.log(JSON.stringify({",
      "  format: module.format,",
      "  moduleKeys: Object.keys(module).sort(),",
      "  formCount: Object.keys(module.forms).length,",
      "  formKeys: Object.keys(form).sort(),",
      "  configurationKeys: Object.keys(module.byItemType.MetadataConfiguration).sort(),",
      "  formValidateType: typeof form.validate,",
      "  formValidateResultType: typeof form.validate(42),",
      "  formErrorKeys: Object.keys(form.validate.errors?.[0] ?? {}).sort(),",
      "  hasConfiguration: module.byItemType.MetadataConfiguration !== undefined,",
      "  hasConfigurationExtension: module.byItemType.MetadataConfigurationExtension !== undefined,",
      "}))",
    ].join("\n")
    const { stdout } = await execFileAsync(process.execPath, ["-e", script])
    generatedValidatorsSummary = JSON.parse(stdout)
  })

  it("loads generated validators from dist when build has produced them", () => {
    if (generatedValidatorsSummary === undefined) return

    expect(generatedValidatorsSummary).toEqual({
      format: "project-validation-ajv-standalone-v4",
      moduleKeys: ["byItemType", "format", "forms"],
      formCount: 2,
      formKeys: ["validate"],
      configurationKeys: ["validate"],
      formValidateType: "function",
      formValidateResultType: "boolean",
      formErrorKeys: ["instancePath", "keyword", "message", "params", "schemaPath"],
      hasConfiguration: true,
      hasConfigurationExtension: true,
    })
  })
})
