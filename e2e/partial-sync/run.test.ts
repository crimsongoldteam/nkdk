import { describe, expect, it } from "vitest"
import { parsePartialSyncArgs, runPartialSyncCli } from "./run"

describe("partial sync command", () => {
  it("parses an absolute root containing spaces", () => {
    expect(parsePartialSyncArgs([
      "--",
      "--root",
      "/Users/nikita/Базы 1С/temp_test",
    ])).toEqual({ root: "/Users/nikita/Базы 1С/temp_test" })
  })

  it.each([
    ["missing root", []],
    ["missing value", ["--root"]],
    ["duplicate root", ["--root", "/first", "--root", "/second"]],
    ["relative root", ["--root", "relative"]],
    ["unknown argument", ["--other", "/workspace"]],
  ])("rejects %s", (_name, argv) => {
    expect(() => parsePartialSyncArgs(argv)).toThrow()
  })

  it("passes the scenario root only through the child environment", async () => {
    const launches: Array<{
      command: string
      args: readonly string[]
      env: NodeJS.ProcessEnv
    }> = []

    await expect(runPartialSyncCli([
      "--root",
      "/Users/nikita/Базы 1С/temp_test",
    ], {
      vitestPath: "/repo/node_modules/vitest/vitest.mjs",
      async runProcess(command, args, options) {
        launches.push({ command, args, env: options.env })
        return { exitCode: 0 }
      },
    })).resolves.toBeUndefined()

    expect(launches).toEqual([expect.objectContaining({
      command: process.execPath,
      args: ["/repo/node_modules/vitest/vitest.mjs", "run", "--config", "e2e/partial-sync/vitest.config.ts"],
      env: expect.objectContaining({
        NKDK_PARTIAL_SYNC_ROOT: "/Users/nikita/Базы 1С/temp_test",
      }),
    })])
    expect(launches[0]?.args).not.toContain("/Users/nikita/Базы 1С/temp_test")
  })
})
