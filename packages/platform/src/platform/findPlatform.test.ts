import { describe, expect, it } from "vitest"
import { createMemoryRuntime } from "../testing/memoryRuntime"
import { findPlatformWithRuntime } from "./findPlatform"

function linuxRuntime() {
  return createMemoryRuntime({ os: "linux", arch: "x64", env: { HOME: "/home/test" } })
    .directory("/opt/1cv8/x86_64")
    .directory("/opt/1cv8/i386")
    .directory("/opt/1cv8/arm64")
}

describe("findPlatform", () => {
  it("selects the highest numeric supported build and reports applications independently", async () => {
    const runtime = linuxRuntime()
      .directory("/opt/1cv8/x86_64/8.3.27.999")
      .file("/opt/1cv8/x86_64/8.3.27.999/1cv8", { mode: 0o755 })
      .directory("/opt/1cv8/x86_64/8.3.27.1000")
      .file("/opt/1cv8/x86_64/8.3.27.1000/ibcmd", { mode: 0o755 })
      .directory("/opt/1cv8/x86_64/8.3.28.1")
      .file("/opt/1cv8/x86_64/8.3.28.1/ibcmd", { mode: 0o755 })

    await expect(findPlatformWithRuntime(runtime)).resolves.toEqual({
      version: "8.3.27.1000",
      directory: "/opt/1cv8/x86_64/8.3.27.1000",
      ibcmdPath: "/opt/1cv8/x86_64/8.3.27.1000/ibcmd",
    })
  })

  it("rejects non-executable Unix files and candidates without applications", async () => {
    const runtime = linuxRuntime()
      .directory("/opt/1cv8/x86_64/8.3.27.1000")
      .file("/opt/1cv8/x86_64/8.3.27.1000/ibcmd", { mode: 0o644 })

    await expect(findPlatformWithRuntime(runtime)).resolves.toBeUndefined()
  })

  it("prefers native architecture for the same build", async () => {
    const runtime = linuxRuntime()
      .directory("/opt/1cv8/i386/8.3.27.1000")
      .file("/opt/1cv8/i386/8.3.27.1000/ibcmd", { mode: 0o755 })
      .directory("/opt/1cv8/x86_64/8.3.27.1000")
      .file("/opt/1cv8/x86_64/8.3.27.1000/ibcmd", { mode: 0o755 })

    expect((await findPlatformWithRuntime(runtime))?.directory).toBe("/opt/1cv8/x86_64/8.3.27.1000")
  })

  it("rejects a version entry that is not a directory", async () => {
    const runtime = linuxRuntime()
      .file("/opt/1cv8/x86_64/8.3.27.1000")
      .file("/opt/1cv8/x86_64/8.3.27.1000/ibcmd", { mode: 0o755 })

    await expect(findPlatformWithRuntime(runtime)).resolves.toBeUndefined()
  })
})
