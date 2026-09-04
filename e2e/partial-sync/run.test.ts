import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { parsePartialSyncArgs, runPartialSyncCli } from "./run"

describe("partial sync command", () => {
  it("parses an absolute root containing spaces", () => {
    expect(parsePartialSyncArgs([
      "--",
      "--root",
      "/Users/nikita/Базы 1С/temp_test",
      "--reset",
    ])).toEqual({
      root: resolve("/Users/nikita/Базы 1С/temp_test"),
      reset: true,
      mode: "standalone-server",
    })
  })

  it("parses an explicit Designer agent mode", () => {
    expect(parsePartialSyncArgs([
      "--root",
      "/workspace",
      "--mode",
      "designer-agent",
    ])).toEqual({ root: resolve("/workspace"), reset: false, mode: "designer-agent" })
  })

  it.each([
    ["missing root", []],
    ["missing value", ["--root"]],
    ["duplicate root", ["--root", "/first", "--root", "/second"]],
    ["relative root", ["--root", "relative"]],
    ["unknown argument", ["--other", "/workspace"]],
    ["duplicate reset", ["--root", "/workspace", "--reset", "--reset"]],
    ["unknown mode", ["--root", "/workspace", "--mode", "unknown"]],
    ["duplicate mode", ["--root", "/workspace", "--mode", "designer-agent", "--mode", "standalone-server"]],
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
        NKDK_PARTIAL_SYNC_ROOT: resolve("/Users/nikita/Базы 1С/temp_test"),
        NKDK_PARTIAL_SYNC_MODE: "standalone-server",
      }),
    })])
    expect(launches[0]?.args).not.toContain("/Users/nikita/Базы 1С/temp_test")
    expect(launches[0]?.env.NKDK_PARTIAL_SYNC_RESET).toBe(expectedReset)
  })
})
