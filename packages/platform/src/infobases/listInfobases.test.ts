import { describe, expect, it } from "vitest"
import { createMemoryRuntime } from "../testing/memoryRuntime"
import { listInfobasesWithRuntime } from "./listInfobases"

describe("listInfobasesWithRuntime", () => {
  it("combines readable sources, diagnostics, and canonical duplicates without repeated reads", async () => {
    const personal = "/home/test/.1C/1cestart/ibases.v8i"
    const config = "/home/test/.1C/1cestart/1cestart.cfg"
    const firstAlias = "/lists/team.v8i"
    const secondAlias = "/lists/alias.v8i"
    const canonical = "/canonical/team.v8i"
    const runtime = createMemoryRuntime({
      os: "linux",
      arch: "x64",
      env: { HOME: "/home/test" },
    })
      .file(config, { content: `CommonInfoBases=${firstAlias}\nCommonInfoBases=${secondAlias}` })
      .file(personal, {
        content: [
          "[Department]",
          "Folder=/",
          "[Personal]",
          'Connect=File="/data/personal";',
          "Folder=/Department",
        ].join("\n"),
      })
      .file(canonical, {
        content: [
          "[Broken]",
          "Connect=",
          "[Common]",
          'Connect=Srvr="server";Ref="erp";',
          "Folder=/Missing",
        ].join("\n"),
      })
      .canonical(firstAlias, canonical)
      .canonical(secondAlias, canonical)

    const result = await listInfobasesWithRuntime(runtime)

    expect(result.sources).toEqual([
      { path: personal, kind: "personal" },
      { path: firstAlias, kind: "common" },
    ])
    expect(result.tree).toEqual([
      {
        kind: "folder",
        name: "Department",
        source: personal,
        children: [expect.objectContaining({ kind: "infobase", name: "Personal" })],
      },
      {
        kind: "folder",
        name: "Missing",
        source: firstAlias,
        children: [expect.objectContaining({ kind: "infobase", name: "Common" })],
      },
    ])
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-section", source: firstAlias }),
        expect.objectContaining({ code: "implicit-folder", source: firstAlias }),
      ]),
    )
    expect(runtime.readCount(firstAlias)).toBe(1)
    expect(runtime.readCount(secondAlias)).toBe(0)
  })

  it("returns an empty partial result when every source is missing", async () => {
    const runtime = createMemoryRuntime({
      os: "darwin",
      arch: "arm64",
      env: { HOME: "/Users/test" },
    })

    await expect(listInfobasesWithRuntime(runtime)).resolves.toEqual({
      tree: [],
      sources: [],
      warnings: [
        expect.objectContaining({
          code: "source-not-found",
          source: "/Users/test/.1C/1cestart/ibases.v8i",
        }),
      ],
    })
  })

  it("turns a read failure into a warning", async () => {
    const personal = "/home/test/.1C/1cestart/ibases.v8i"
    const denied = Object.assign(new Error("permission denied"), { code: "EACCES" })
    const runtime = createMemoryRuntime({
      os: "linux",
      arch: "x64",
      env: { HOME: "/home/test" },
    })
      .file(personal)
      .readError(personal, denied)

    const result = await listInfobasesWithRuntime(runtime)

    expect(result.sources).toEqual([])
    expect(result.warnings).toEqual([
      expect.objectContaining({ code: "source-unreadable", source: personal }),
    ])
  })
})
