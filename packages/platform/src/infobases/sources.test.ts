import { describe, expect, it } from "vitest"
import { createMemoryRuntime } from "../testing/memoryRuntime"
import { discoverInfobaseSources } from "./sources"

describe("discoverInfobaseSources", () => {
  it("returns the Windows personal list and common lists in configuration order", async () => {
    const userConfig = "C:\\Users\\Test\\AppData\\Roaming\\1C\\1CEStart\\1CEStart.cfg"
    const allUsersConfig = "C:\\ProgramData\\1C\\1CEStart\\1CEStart.cfg"
    const commonConfig = "C:\\Users\\Test\\AppData\\Roaming\\1C\\shared\\1cescmn.cfg"
    const runtime = createMemoryRuntime({
      os: "win32",
      arch: "x64",
      env: {
        APPDATA: "C:\\Users\\Test\\AppData\\Roaming",
        ALLUSERSPROFILE: "C:\\ProgramData",
        COMPANY_LISTS: "Z:\\Company",
      },
    })
      .file(userConfig, {
        content: [
          "CommonInfoBases=..\\shared\\team.v8i",
          "WebCommonInfoBases=https://example.invalid/bases.v8i",
          "CommonCfgLocation=..\\shared\\1cescmn.cfg",
        ].join("\n"),
      })
      .file(allUsersConfig, {
        content: [
          "CommonInfoBases=%company_lists%\\all.v8i",
          "CommonInfoBases=C:\\ProgramData\\1C\\1CEStart\\..\\1CEStart\\all.v8i",
        ].join("\n"),
      })
      .file(commonConfig, { content: "CommonInfoBases=nested\\department.v8i" })

    await expect(discoverInfobaseSources(runtime)).resolves.toEqual({
      candidates: [
        {
          path: "C:\\Users\\Test\\AppData\\Roaming\\1C\\1CEStart\\ibases.v8i",
          kind: "personal",
        },
        {
          path: "C:\\Users\\Test\\AppData\\Roaming\\1C\\shared\\team.v8i",
          kind: "common",
        },
        { path: "Z:\\Company\\all.v8i", kind: "common" },
        { path: "C:\\ProgramData\\1C\\1CEStart\\all.v8i", kind: "common" },
        {
          path: "C:\\Users\\Test\\AppData\\Roaming\\1C\\shared\\nested\\department.v8i",
          kind: "common",
        },
      ],
      warnings: [],
    })
  })

  it.each(["linux", "darwin"] as const)("uses the Unix personal path and environment syntax on %s", async (os) => {
    const config = "/home/test/.1C/1cestart/1cestart.cfg"
    const runtime = createMemoryRuntime({
      os,
      arch: "x64",
      env: { HOME: "/home/test", LIST_ROOT: "/srv/1c" },
    }).file(config, {
      content: ["CommonInfoBases=$LIST_ROOT/team.v8i", "CommonInfoBases=${LIST_ROOT}/team.v8i"].join("\n"),
    })

    await expect(discoverInfobaseSources(runtime)).resolves.toEqual({
      candidates: [
        { path: "/home/test/.1C/1cestart/ibases.v8i", kind: "personal" },
        { path: "/srv/1c/team.v8i", kind: "common" },
      ],
      warnings: [],
    })
  })

  it("reports only an explicitly declared missing common configuration", async () => {
    const config = "/home/test/.1C/1cestart/1cestart.cfg"
    const missing = "/home/test/.1C/shared/missing.cfg"
    const runtime = createMemoryRuntime({
      os: "linux",
      arch: "x64",
      env: { HOME: "/home/test" },
    }).file(config, { content: "CommonCfgLocation=../shared/missing.cfg" })

    const result = await discoverInfobaseSources(runtime)

    expect(result.candidates).toEqual([
      { path: "/home/test/.1C/1cestart/ibases.v8i", kind: "personal" },
    ])
    expect(result.warnings).toEqual([
      expect.objectContaining({ code: "invalid-config", source: missing }),
    ])
  })
})
