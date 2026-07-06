import { execFile } from "node:child_process"
import { existsSync } from "node:fs"
import { promisify } from "node:util"
import { describe, expect, it } from "vitest"

const execFileAsync = promisify(execFile)

describe("project validation standalone build output", () => {
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
