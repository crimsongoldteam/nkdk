import { describe, expect, it } from "vitest"
import { createMemoryRuntime } from "../testing/memoryRuntime"
import { collectInstallationRoots } from "./roots"

describe("collectInstallationRoots", () => {
  it("puts configured roots before documented Windows roots and removes case-insensitive duplicates", async () => {
    const config = "C:\\Users\\Test\\AppData\\Roaming\\1C\\1CEStart\\1CEStart.cfg"
    const runtime = createMemoryRuntime({
      os: "win32",
      arch: "x64",
      env: {
        APPDATA: "C:\\Users\\Test\\AppData\\Roaming",
        ALLUSERSPROFILE: "C:\\ProgramData",
        ProgramFiles: "C:\\Program Files",
        "ProgramFiles(x86)": "C:\\Program Files (x86)",
        LOCALAPPDATA: "C:\\Users\\Test\\AppData\\Local",
      },
    }).file(config, {
      content: ["InstalledLocation=D:\\1cv8", "InstalledLocation=d:\\1CV8"].join("\n"),
    })

    const result = await collectInstallationRoots(runtime)

    expect(result.map(({ path }) => path)).toEqual([
      "D:\\1cv8",
      "C:\\Program Files\\1cv8",
      "C:\\Program Files (x86)\\1cv8",
      "C:\\Users\\Test\\AppData\\Local\\Programs\\1cv8",
      "C:\\Users\\Test\\AppData\\Local\\Programs\\1cv8_x86",
      "C:\\Users\\Test\\AppData\\Local\\Programs\\1cv8_x64",
    ])
  })

  it.each([
    ["linux", ["/opt/1cv8/x86_64", "/opt/1cv8/i386", "/opt/1cv8/arm64"]],
    ["darwin", ["/opt/1cv8"]],
  ] as const)("returns documented %s roots", async (os, expected) => {
    const runtime = createMemoryRuntime({ os, arch: "x64", env: { HOME: "/home/test" } })

    await expect(collectInstallationRoots(runtime)).resolves.toMatchObject(
      expected.map((path) => ({ path, source: "standard" })),
    )
  })
})
