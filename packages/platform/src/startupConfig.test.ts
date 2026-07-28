import { describe, expect, it } from "vitest"
import { createMemoryRuntime } from "./testing/memoryRuntime"
import { readStartupConfiguration } from "./startupConfig"

describe("readStartupConfiguration", () => {
  it("preserves repeated keys and follows a common configuration once", async () => {
    const userConfig = "C:\\Users\\Test\\AppData\\Roaming\\1C\\1CEStart\\1CEStart.cfg"
    const commonConfig = "C:\\Users\\Test\\AppData\\Roaming\\1C\\shared\\1cescmn.cfg"
    const runtime = createMemoryRuntime({
      os: "win32",
      arch: "x64",
      env: {
        APPDATA: "C:\\Users\\Test\\AppData\\Roaming",
        ALLUSERSPROFILE: "C:\\ProgramData",
      },
    })
      .file(userConfig, {
        content: [
          "CommonCfgLocation=..\\shared\\1cescmn.cfg",
          "commoncfglocation=..\\shared\\1cescmn.cfg",
          "installedlocation=C:\\User\\1cv8",
          "InstalledLocation=C:\\User\\Second",
        ].join("\n"),
      })
      .file(commonConfig, { content: "InstalledLocation=Z:\\Company\\1cv8" })

    const result = await readStartupConfiguration(runtime)

    expect(result.warnings).toEqual([])
    expect(result.files.map(({ kind }) => kind)).toEqual(["user-config", "common-config"])
    expect(result.files[0]?.entries.filter(({ key }) => key === "installedlocation")).toEqual([
      { key: "installedlocation", value: "C:\\User\\1cv8", order: 2 },
      { key: "installedlocation", value: "C:\\User\\Second", order: 3 },
    ])
  })
})
