import { describe, expect, it } from "vitest"
import { createMemoryRuntime } from "./memoryRuntime"

describe("memory runtime", () => {
  it("models directories, files, canonical paths, and read failures", async () => {
    const runtime = createMemoryRuntime({ os: "linux", arch: "x64", env: { HOME: "/home/test" } })
      .directory("/opt/1cv8")
      .directory("/opt/1cv8/x86_64")
      .file("/opt/1cv8/x86_64/ibcmd", { mode: 0o755, content: "binary" })
      .canonical("/opt/link", "/opt/1cv8/x86_64")
      .readError("/broken.cfg", new Error("EACCES"))

    await expect(runtime.fs.readdir("/opt/1cv8")).resolves.toEqual(["x86_64"])
    await expect(runtime.fs.stat("/opt/1cv8/x86_64/ibcmd")).resolves.toEqual({
      isFile: true,
      isDirectory: false,
      mode: 0o755,
    })
    await expect(runtime.fs.readFile("/opt/1cv8/x86_64/ibcmd")).resolves.toBe("binary")
    await expect(runtime.fs.realpath("/opt/link")).resolves.toBe("/opt/1cv8/x86_64")
    await expect(runtime.fs.readFile("/broken.cfg")).rejects.toThrow("EACCES")
  })
})
