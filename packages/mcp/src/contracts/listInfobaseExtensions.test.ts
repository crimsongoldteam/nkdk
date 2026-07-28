import { describe, expect, it } from "vitest"
import { z } from "zod/v4"
import {
  listInfobaseExtensionsInputShape,
  listInfobaseExtensionsOutputShape,
} from "./listInfobaseExtensions"

const extension = {
  name: "Patch",
  version: "",
  active: true,
  purpose: "patch",
  safeMode: false,
  securityProfileName: "",
  unsafeActionProtection: true,
  usedInDistributedInfobase: false,
  scope: "infobase",
  hashSum: "hash",
}

describe("list_infobase_extensions contract", () => {
  const inputSchema = z.strictObject(listInfobaseExtensionsInputShape)

  it("accepts only a non-empty project directory", () => {
    expect(inputSchema.parse({ projectDir: "/project" })).toEqual({
      projectDir: "/project",
    })
    expect(() => inputSchema.parse({ projectDir: "" })).toThrow()
    expect(() =>
      inputSchema.parse({ projectDir: "/project", user: "Admin" })
    ).toThrow()
  })

  it("accepts full and empty successful results", () => {
    expect(
      listInfobaseExtensionsOutputShape.parse({
        ok: true,
        extensions: [extension],
        mode: "standalone-server",
        reusedConnection: true,
      })
    ).toMatchObject({ ok: true, extensions: [extension] })
    expect(
      listInfobaseExtensionsOutputShape.parse({
        ok: true,
        extensions: [],
        mode: "designer-agent",
        reusedConnection: false,
      })
    ).toMatchObject({ ok: true, extensions: [] })
  })

  it("rejects unknown extension properties", () => {
    expect(() =>
      listInfobaseExtensionsOutputShape.parse({
        ok: true,
        extensions: [{ ...extension, secretRawField: "raw" }],
        mode: "designer-agent",
        reusedConnection: false,
      })
    ).toThrow()
  })
})
