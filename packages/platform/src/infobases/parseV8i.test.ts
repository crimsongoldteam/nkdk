import { describe, expect, it } from "vitest"
import { parseV8i } from "./parseV8i"

describe("parseV8i", () => {
  it("parses folders, bases, BOM, equals signs, and stable order", () => {
    const result = parseV8i(
      [
        "\uFEFF[Мои=учебные]",
        "ID=folder-id",
        "Folder=/",
        "OrderInTree=49152",
        "",
        "[ERP]",
        'Connect=Srvr="server";Ref="erp";',
        "ID=base-id",
        "Folder=/Мои=учебные",
        "OrderInTree=32768",
        "DefaultVersion=8.3.27.2074",
      ].join("\n"),
      "personal.v8i",
      0,
    )

    expect(result.warnings).toEqual([])
    expect(result.records).toEqual([
      expect.objectContaining({ kind: "folder", name: "Мои=учебные", folder: "/", orderInTree: 49152 }),
      expect.objectContaining({
        kind: "infobase",
        name: "ERP",
        id: "base-id",
        folder: "/Мои=учебные",
        orderInTree: 32768,
        connection: { type: "server", server: "server", reference: "erp" },
        rawConnection: 'Srvr="server";Ref="erp";',
        defaultVersion: "8.3.27.2074",
      }),
    ])
  })

  it("skips a malformed section and keeps a following valid section", () => {
    const result = parseV8i("[Broken]\nConnect=\n[Valid]\nConnect=File=\"/data\";", "bases.v8i", 0)

    expect(result.records).toHaveLength(1)
    expect(result.records[0]).toMatchObject({ kind: "infobase", name: "Valid", recordOrder: 1 })
    expect(result.warnings).toEqual([
      expect.objectContaining({ code: "invalid-section", source: "bases.v8i" }),
    ])
  })
})
