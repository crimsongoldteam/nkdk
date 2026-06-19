import { roundTripYAMLFast, type RoundTripYAMLFastResult } from "@nakidka/core"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { roundTripYAMLFastCommand } from "./roundTripYAMLFast"

const mocks = vi.hoisted(() => ({
  roundTripYAMLFast: vi.fn<(_params: { inputDir: string }) => Promise<RoundTripYAMLFastResult>>(async () => ({
    checked: 0,
    diffs: [],
    errors: [],
  })),
}))

vi.mock("@nakidka/core", () => ({
  roundTripYAMLFast: mocks.roundTripYAMLFast,
}))

describe("roundTripYAMLFast command", () => {
  const originalExitCode = process.exitCode

  beforeEach(() => {
    mocks.roundTripYAMLFast.mockReset()
    mocks.roundTripYAMLFast.mockResolvedValue({ checked: 0, diffs: [], errors: [] })
  })

  afterEach(() => {
    process.exitCode = originalExitCode
    vi.restoreAllMocks()
  })

  it("prints clean result without setting exit code", async () => {
    mocks.roundTripYAMLFast.mockResolvedValue({ checked: 2, diffs: [], errors: [] } satisfies RoundTripYAMLFastResult)
    const stdout = captureStdout()

    await roundTripYAMLFastCommand("xml")

    expect(roundTripYAMLFast).toHaveBeenCalledWith({ inputDir: "xml" })
    expect(writtenText(stdout)).toBe(
      ["=== ROUND_TRIP_YAML_FAST ===", "checked: 2", "diffs: 0", "errors: 0", "=== DIFF_COUNT ===", "0", ""].join(
        "\n",
      ),
    )
    expect(process.exitCode).toBeUndefined()
  })

  it("prints diffs but keeps zero exit code", async () => {
    mocks.roundTripYAMLFast.mockResolvedValue({
      checked: 1,
      diffs: [{ file: "Enums/Виды.xml", xmlFileAbs: "/tmp/xml/Enums/Виды.xml", diffText: "--- old\n+++ new" }],
      errors: [],
    } satisfies RoundTripYAMLFastResult)
    const stdout = captureStdout()

    await roundTripYAMLFastCommand("xml")

    const text = writtenText(stdout)
    expect(text).toContain("=== DIFF_COUNT ===\n1\n")
    expect(text).toContain("=== DIFF ===\nfile: Enums/Виды.xml\nxmlFileAbs: /tmp/xml/Enums/Виды.xml\n--- old\n+++ new\n")
    expect(text).not.toContain("=== ERRORS ===")
    expect(process.exitCode).toBeUndefined()
  })

  it("prints processing errors and sets exit code", async () => {
    mocks.roundTripYAMLFast.mockResolvedValue({
      checked: 1,
      diffs: [],
      errors: [{ file: "Enums/Bad.xml", xmlFileAbs: "/tmp/xml/Enums/Bad.xml", message: "Failed to parse XML" }],
    } satisfies RoundTripYAMLFastResult)
    const stdout = captureStdout()

    await roundTripYAMLFastCommand("xml")

    const text = writtenText(stdout)
    expect(text).toContain("=== ERRORS ===\n")
    expect(text).toContain("file: Enums/Bad.xml\nxmlFileAbs: /tmp/xml/Enums/Bad.xml\nFailed to parse XML\n")
    expect(process.exitCode).toBe(1)
  })
})

function captureStdout() {
  return vi.spyOn(process.stdout, "write").mockImplementation(() => true)
}

function writtenText(writer: ReturnType<typeof captureStdout>): string {
  return writer.mock.calls.map(([chunk]) => String(chunk)).join("")
}
