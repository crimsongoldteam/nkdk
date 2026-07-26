import { describe, expect, it } from "vitest"
import { z } from "zod/v4"
import {
  importFromInfobaseInputShape,
  importFromInfobaseOutputShape,
} from "./importFromInfobase"

describe("import_from_infobase contract", () => {
  const inputSchema = z.strictObject(importFromInfobaseInputShape)

  it("accepts a file connection without a user", () => {
    expect(
      inputSchema.parse({
        projectDir: "/project",
        connectionString: 'File="/Users/nikita/Базы 1С/all";',
        useStandaloneServer: false,
        sessionIdleTimeout: 900,
        allowWrite: true,
      })
    ).toEqual({
      projectDir: "/project",
      connectionString: 'File="/Users/nikita/Базы 1С/all";',
      useStandaloneServer: false,
      sessionIdleTimeout: 900,
      allowWrite: true,
    })
  })

  it.each([0, -1, 1.5])("rejects an invalid timeout: %s", (sessionIdleTimeout) => {
    expect(() =>
      inputSchema.parse({
        projectDir: "/project",
        connectionString: 'File="/bases/demo";',
        sessionIdleTimeout,
      })
    ).toThrow()
  })

  it("rejects extra fields", () => {
    expect(() =>
      inputSchema.parse({
        projectDir: "/project",
        connectionString: 'File="/bases/demo";',
        componentPath: "cf",
      })
    ).toThrow()
  })

  it("accepts a preserved temporary directory in a successful partial import", () => {
    expect(
      importFromInfobaseOutputShape.parse({
        ok: true,
        succeeded: 1,
        failed: [{ kind: "failed", name: "Catalogs/Test.xml", message: "failed" }],
        warnings: [],
        mode: "designer-agent",
        reusedConnection: false,
        temporaryDirectory: "/project/.nkdk/tmp/import-from-infobase/op-1",
      })
    ).toMatchObject({ ok: true })
  })
})
