import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import { describe, expect, it } from "vitest"
import { generateProjectValidationAjvStandalone } from "./generateProjectValidationAjvStandalone"

describe("project validation standalone build output", () => {
  it("generates an importable standalone module", async () => {
    const dir = await mkdtemp(join(tmpdir(), "nkdk-validation-standalone-"))
    const outfile = join(dir, "projectValidationAjvStandalone.js")

    try {
      await generateProjectValidationAjvStandalone({ outfile })

      const module = (await import(`${pathToFileURL(outfile).href}?t=${Date.now()}`)).default

      expect(module).toMatchObject({
        format: "project-validation-ajv-standalone-v1",
        context: {
          version: "2.20",
          defaultLanguage: "ru",
          exportToYAML: { toTyped: false },
        },
      })
      expect(typeof module.form.validate).toBe("function")
      expect(typeof module.form.validate({})).toBe("boolean")
      expect(module.byProjectDir[""]).toBeDefined()
    } finally {
      await rm(dir, { force: true, recursive: true })
    }
  }, 30_000)
})
