import { describe, expect, it } from "vitest"
import { Value } from "typebox/value"
import {
  listInfobaseExtensionsInputSchema,
  listInfobaseExtensionsInputShape,
  listInfobaseExtensionsOutputShape,
  listInfobaseExtensionsSuccessSchema,
} from "./listInfobaseExtensions"
import { parseTypeBox } from "./mcpSchema"

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
  const inputSchema = listInfobaseExtensionsInputSchema

  it("accepts only a non-empty project directory", () => {
    expect(parseTypeBox(inputSchema, { projectDir: "/project" })).toEqual({
      projectDir: "/project",
    })
    expect(() => parseTypeBox(inputSchema, { projectDir: "" })).toThrow()
    expect(() =>
      parseTypeBox(inputSchema, { projectDir: "/project", user: "Admin" })
    ).toThrow()
  })

  it("accepts full and empty successful results", () => {
    expect(
      parseTypeBox(listInfobaseExtensionsOutputShape, {
        ok: true,
        extensions: [extension],
        mode: "standalone-server",
        reusedConnection: true,
      })
    ).toMatchObject({ ok: true, extensions: [extension] })
    expect(
      parseTypeBox(listInfobaseExtensionsOutputShape, {
        ok: true,
        extensions: [],
        mode: "designer-agent",
        reusedConnection: false,
      })
    ).toMatchObject({ ok: true, extensions: [] })
  })

  it("rejects unknown extension properties", () => {
    expect(() =>
      parseTypeBox(listInfobaseExtensionsOutputShape, {
        ok: true,
        extensions: [{ ...extension, secretRawField: "raw" }],
        mode: "designer-agent",
        reusedConnection: false,
      })
    ).toThrow()
  })

  it("publishes the strict successful output schema", () => {
    expect(
      parseTypeBox(listInfobaseExtensionsSuccessSchema, {
        ok: true,
        extensions: [],
        mode: "designer-agent",
        reusedConnection: false,
      })
    ).toMatchObject({ ok: true, extensions: [] })
    expect(() =>
      parseTypeBox(listInfobaseExtensionsSuccessSchema, {
        ok: true,
        extensions: [],
        mode: "designer-agent",
        reusedConnection: false,
        raw: "unexpected",
      })
    ).toThrow()
  })

  it("отклоняет лишние свойства без преобразования данных", () => {
    expect(Value.Check(listInfobaseExtensionsSuccessSchema, {
      ok: true,
      extensions: [],
      mode: "designer-agent",
      reusedConnection: false,
      raw: "unexpected",
    })).toBe(false)
  })
})
