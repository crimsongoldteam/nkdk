import { afterEach, describe, expect, it, vi } from "vitest"
import { createProgram, runCli } from "./cli"

describe("cli", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    process.exitCode = undefined
  })

  it("handles missing validate yaml-dir as command usage error", () => {
    const stderr = captureStderr()
    const program = createProgram()
    program.exitOverride()

    expect(() => program.parse(["node", "nkdk", "validate"], { from: "node" })).not.toThrow()

    expect(writtenText(stderr)).toContain("Не указан путь к YAML-проекту")
    expect(process.exitCode).toBe(2)
  })

  it("exits after unhandled async command errors in real CLI mode", async () => {
    const stderr = captureStderr()
    const exit = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never)

    runCli(["node", "nkdk", "schema", "MetadataCatalog", "--inline"])
    await waitForAsyncCatch()

    expect(writtenText(stderr)).toContain("--inline можно использовать только вместе с --json-schema")
    expect(exit).toHaveBeenCalledWith(1)
  })
})

function captureStderr() {
  return vi.spyOn(process.stderr, "write").mockImplementation(() => true)
}

function writtenText(writer: ReturnType<typeof captureStderr>): string {
  return writer.mock.calls.map(([chunk]) => String(chunk)).join("")
}

async function waitForAsyncCatch(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve))
}
