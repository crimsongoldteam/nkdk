import { describe, expect, it } from "vitest"
import { parsePartialSyncArgs, runPartialSyncCli } from "./run"

describe("partial sync command", () => {
  it("parses an absolute root containing spaces", () => {
    expect(parsePartialSyncArgs([
      "--",
      "--root",
      "/Users/nikita/Базы 1С/temp_test",
      "--reset",
    ])).toEqual({ root: "/Users/nikita/Базы 1С/temp_test", reset: true })
  })

  it.each([
    ["missing root", []],
    ["missing value", ["--root"]],
    ["duplicate root", ["--root", "/first", "--root", "/second"]],
    ["relative root", ["--root", "relative"]],
    ["unknown argument", ["--other", "/workspace"]],
    ["duplicate reset", ["--root", "/workspace", "--reset", "--reset"]],
  ])("rejects %s", (_name, argv) => {
    expect(() => parsePartialSyncArgs(argv)).toThrow()
  })

  it.each([
    ["without reset", [], undefined],
    ["with reset", ["--reset"], "1"],
  ] as const)("passes the scenario root through the child environment %s", async (
    _name,
    resetArgs,
    expectedReset,
  ) => {
    const launches: Array<{
      command: string
      args: readonly string[]
      env: NodeJS.ProcessEnv
    }> = []

    await expect(runPartialSyncCli([
      "--root",
      "/Users/nikita/Базы 1С/temp_test",
      ...resetArgs,
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
    expect(launches[0]?.env.NKDK_PARTIAL_SYNC_RESET).toBe(expectedReset)
  })
})
