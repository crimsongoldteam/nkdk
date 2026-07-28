import { describe, expect, it } from "vitest"
import type { ParsedFolderRecord, ParsedInfobaseRecord } from "./types"
import { buildInfobaseTree } from "./tree"

const folder = (
  name: string,
  parent: string,
  source: string,
  sourceOrder: number,
  recordOrder: number,
  orderInTree?: number,
): ParsedFolderRecord => ({
  kind: "folder",
  name,
  folder: parent,
  fields: {},
  source,
  sourceOrder,
  recordOrder,
  ...(orderInTree === undefined ? {} : { orderInTree }),
})

const base = (
  name: string,
  parent: string,
  source: string,
  sourceOrder: number,
  recordOrder: number,
  options: Partial<ParsedInfobaseRecord> = {},
): ParsedInfobaseRecord => ({
  kind: "infobase",
  name,
  folder: parent,
  fields: {},
  source,
  sourceOrder,
  recordOrder,
  connection: { type: "file", path: `/data/${name}` },
  rawConnection: `File="/data/${name}";`,
  ...options,
})

describe("buildInfobaseTree", () => {
  it("builds nested folders and preserves an explicit empty folder", () => {
    const result = buildInfobaseTree(
      [
        [
          folder("Department", "/", "personal.v8i", 0, 0),
          folder("Empty", "/Department", "personal.v8i", 0, 1),
          base("ERP", "/Department", "personal.v8i", 0, 2),
        ],
      ],
      { os: "linux" },
    )

    expect(result).toEqual({
      tree: [
        {
          kind: "folder",
          name: "Department",
          source: "personal.v8i",
          children: [
            { kind: "folder", name: "Empty", source: "personal.v8i", children: [] },
            expect.objectContaining({ kind: "infobase", name: "ERP", source: "personal.v8i" }),
          ],
        },
      ],
      warnings: [],
    })
  })

  it("creates missing intermediate folders once and reports them", () => {
    const result = buildInfobaseTree(
      [[base("ERP", "/Department/ERP", "personal.v8i", 0, 0)]],
      { os: "linux" },
    )

    expect(result.tree).toEqual([
      {
        kind: "folder",
        name: "Department",
        source: "personal.v8i",
        children: [
          {
            kind: "folder",
            name: "ERP",
            source: "personal.v8i",
            children: [expect.objectContaining({ kind: "infobase", name: "ERP" })],
          },
        ],
      },
    ])
    expect(result.warnings).toEqual([
      expect.objectContaining({ code: "implicit-folder", source: "personal.v8i" }),
      expect.objectContaining({ code: "implicit-folder", source: "personal.v8i" }),
    ])
  })

  it("orders siblings by OrderInTree and then by source and record order", () => {
    const result = buildInfobaseTree(
      [
        [
          base("Unordered", "/", "personal.v8i", 0, 0),
          base("Later", "/", "personal.v8i", 0, 1, { orderInTree: 20 }),
          base("Earlier", "/", "personal.v8i", 0, 2, { orderInTree: 10 }),
        ],
        [base("SameOrder", "/", "common.v8i", 1, 0, { orderInTree: 20 })],
      ],
      { os: "linux" },
    )

    expect(result.tree.map(({ name }) => name)).toEqual(["Earlier", "Later", "SameOrder", "Unordered"])
  })

  it("removes duplicate bases only between sources by ID or normalized connection", () => {
    const result = buildInfobaseTree(
      [
        [
          base("First", "/", "personal.v8i", 0, 0, {
            id: "shared-id",
            connection: { type: "server", server: "SERVER", reference: "ERP" },
            rawConnection: 'Srvr="SERVER";Ref="ERP";',
          }),
          base("Alias", "/", "personal.v8i", 0, 1, {
            connection: { type: "server", server: "server", reference: "erp" },
            rawConnection: 'Ref="erp";Srvr="server";',
          }),
        ],
        [
          base("DuplicateById", "/", "common.v8i", 1, 0, { id: "shared-id" }),
          base("DuplicateByConnection", "/", "common.v8i", 1, 1, {
            connection: { type: "server", server: "server", reference: "erp" },
            rawConnection: 'ref="erp";srvr="server";',
          }),
        ],
      ],
      { os: "linux" },
    )

    expect(result.tree.map(({ name }) => name)).toEqual(["First", "Alias"])
  })

  it("compares Windows file connections without case and merges a folder path across sources", () => {
    const result = buildInfobaseTree(
      [
        [
          folder("Shared", "/", "personal.v8i", 0, 0),
          base("First", "/Shared", "personal.v8i", 0, 1, {
            connection: { type: "file", path: "C:\\Bases\\ERP" },
            rawConnection: 'File="C:\\Bases\\ERP";',
          }),
        ],
        [
          folder("Shared", "/", "common.v8i", 1, 0),
          base("Duplicate", "/Shared", "common.v8i", 1, 1, {
            connection: { type: "file", path: "c:\\bases\\erp\\" },
            rawConnection: 'File="c:\\bases\\erp\\";',
          }),
          base("Second", "/Shared", "common.v8i", 1, 2),
        ],
      ],
      { os: "win32" },
    )

    expect(result.tree).toEqual([
      {
        kind: "folder",
        name: "Shared",
        source: "personal.v8i",
        children: [
          expect.objectContaining({ kind: "infobase", name: "First" }),
          expect.objectContaining({ kind: "infobase", name: "Second" }),
        ],
      },
    ])
  })
})
