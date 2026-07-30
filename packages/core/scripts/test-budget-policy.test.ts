import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
// @ts-expect-error CLI-модуль остаётся исполняемым JavaScript без отдельной декларации типов.
import { TEST_DURATION_BUDGET_MS } from "./assert-test-durations.mjs"

const packageFiles = [
  resolve(import.meta.dirname, "..", "package.json"),
  resolve(import.meta.dirname, "..", "..", "platform", "package.json"),
  resolve(import.meta.dirname, "..", "..", "mcp", "package.json"),
]

describe("test duration budget policy", () => {
  it("keeps the duration budget fixed at 50 ms", () => {
    expect(TEST_DURATION_BUDGET_MS).toBe(50)
  })

  it("checks every non-interactive Vitest script without a limit override", () => {
    const commands = packageFiles.flatMap((packageFile) => {
      const packageJson = JSON.parse(readFileSync(packageFile, "utf8")) as {
        scripts?: Record<string, string>
      }
      return Object.entries(packageJson.scripts ?? {})
        .filter(([, command]) => command.includes("vitest run"))
        .map(([name, command]) => ({ packageFile, name, command }))
    })

    expect(commands.length).toBeGreaterThan(0)
    for (const { packageFile, name, command } of commands) {
      const script = `${packageFile}#${name}`
      expect(command, script).toContain("--reporter=json")
      expect(command, script).toMatch(/--outputFile(?:\.json)?=/)
      expect(command, script).toContain("assert-test-durations.mjs")
      expect(command, script).not.toContain("--max-ms")
      expect(command, script).not.toMatch(/TEST_DURATION|MAX_TEST/i)
    }
  })
})
