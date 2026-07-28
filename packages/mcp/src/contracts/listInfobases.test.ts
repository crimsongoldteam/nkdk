import { describe, expect, it } from "vitest"
import { listInfobasesOutputShape } from "./listInfobases"

describe("listInfobases contract", () => {
  it("accepts the public recursive tree and all connection variants", () => {
    const result = listInfobasesOutputShape.safeParse({
      ok: true,
      tree: [
        {
          kind: "folder",
          name: "Department",
          source: "personal.v8i",
          children: [
            {
              kind: "infobase",
              name: "File",
              connection: { type: "file", path: "/data/base" },
              rawConnection: 'File="/data/base";',
              source: "personal.v8i",
            },
            {
              kind: "infobase",
              name: "Server",
              id: "base-id",
              connection: { type: "server", server: "server", reference: "erp" },
              rawConnection: 'Srvr="server";Ref="erp";',
              version: "8.3.27.2074",
              defaultVersion: "8.3.27",
              app: "ThinClient",
              source: "common.v8i",
            },
            {
              kind: "infobase",
              name: "Unknown",
              connection: { type: "unknown", raw: "Future=value;" },
              rawConnection: "Future=value;",
              source: "common.v8i",
            },
          ],
        },
      ],
      sources: [
        { path: "personal.v8i", kind: "personal" },
        { path: "common.v8i", kind: "common" },
      ],
      warnings: [
        {
          code: "implicit-folder",
          source: "common.v8i",
          message: "Неявно создана папка",
        },
      ],
    })

    expect(result.success).toBe(true)
  })

  it("rejects internal parser fields", () => {
    const result = listInfobasesOutputShape.safeParse({
      ok: true,
      tree: [
        {
          kind: "infobase",
          name: "Base",
          connection: { type: "web", url: "https://example.test/base" },
          rawConnection: "ws=https://example.test/base;",
          source: "bases.v8i",
          fields: { Connect: "internal" },
        },
      ],
      sources: [],
      warnings: [],
    })

    expect(result.success).toBe(false)
  })
})
