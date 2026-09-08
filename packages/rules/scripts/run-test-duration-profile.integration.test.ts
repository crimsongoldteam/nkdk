import fs from "node:fs"
import { execFileSync } from "node:child_process"
import os from "node:os"
import { join, resolve } from "node:path"
import { afterEach, beforeAll, describe, expect, it } from "vitest"
// @ts-expect-error CLI-модуль остаётся JavaScript без декларации типов.
import { parseProfileArguments, runTestDurationProfile } from "./run-test-duration-profile.mjs"

const temporaryDirectories: string[] = []
let profileConfiguration: { seed: number; shuffle: boolean; groups: number[] }

beforeAll(() => {
  profileConfiguration = JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e", `
    import { createVitest } from "vitest/node";
    const vitest = await createVitest("test", { root: process.cwd(), watch: false, isolate: false });
    try {
      console.log(JSON.stringify({
        seed: vitest.config.sequence.seed,
        shuffle: vitest.config.sequence.shuffle,
        groups: vitest.projects.map(project => project.config.sequence.groupOrder),
      }));
    } finally { await vitest.close(); }
  `], {
    cwd: resolve(import.meta.dirname, ".."),
    env: { ...process.env, NKDK_TEST_PROFILE_SEED: "20260731" },
    encoding: "utf8",
  }))
})

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true })
  }
})

describe("run test duration profile", () => {
  it("перемешивает тесты воспроизводимо, сохраняя последовательные группы проектов", () => {
    expect(profileConfiguration.seed).toBe(20260731)
    expect(profileConfiguration.shuffle).toBe(true)
    expect(profileConfiguration.groups.length).toBeGreaterThan(1)
    expect(new Set(profileConfiguration.groups).size).toBe(profileConfiguration.groups.length)
  })

  it("uses three runs and a 10 ms threshold", () => {
    expect(parseProfileArguments(["--", "--output", "reports/test-profile/current.json"])).toEqual({
      output: "reports/test-profile/current.json",
      runs: 3,
      thresholdMs: 10,
    })
  })

  it.each([
    { args: [] },
    { args: ["--output", "../outside.json"] },
    { args: ["--output", "reports/test-profile/current.txt"] },
  ])("rejects unsafe arguments: $args", ({ args }) => {
    expect(() => parseProfileArguments(args)).toThrow()
  })

  it("runs three Vitest profiles sequentially and writes their aggregate", () => {
    const projectRoot = fs.mkdtempSync(join(os.tmpdir(), "test-duration-profile-"))
    temporaryDirectories.push(projectRoot)
    const seeds: string[] = []

    const status = runTestDurationProfile(
      projectRoot,
      parseProfileArguments(["--output", "reports/test-profile/current.json"]),
      (_command: string, args: string[], options: { env: NodeJS.ProcessEnv }) => {
        expect(args.some((argument) => argument.startsWith("--sequence."))).toBe(false)
        const seed = options.env.NKDK_TEST_PROFILE_SEED!
        const output = args.find((argument) => argument.startsWith("--outputFile.json="))!.split("=")[1]!
        seeds.push(seed)
        fs.mkdirSync(join(output, ".."), { recursive: true })
        fs.writeFileSync(output, JSON.stringify({
          testResults: [{
            name: join(projectRoot, "packages/rules/example.test.ts"),
            assertionResults: [{ fullName: "example case", duration: 11 + seeds.length }],
          }],
        }))
        return { status: 0 }
      }
    )

    expect(status).toBe(0)
    expect(seeds).toEqual(["20260730", "20260730", "20260731"])
    expect(JSON.parse(fs.readFileSync(join(projectRoot, "reports/test-profile/current.json"), "utf8"))).toEqual({
      version: 1,
      runs: 3,
      thresholdMs: 10,
      seeds: [20260730, 20260730, 20260731],
      tests: [{
        id: "packages/rules/example.test.ts::example case",
        file: "packages/rules/example.test.ts",
        name: "example case",
        durationsMs: [12, 13, 14],
        medianMs: 13,
        maxMs: 14,
        exceedances: 3,
      }],
    })
  })

  it("stops after a failed Vitest run and does not publish a profile", () => {
    const projectRoot = fs.mkdtempSync(join(os.tmpdir(), "test-duration-profile-"))
    temporaryDirectories.push(projectRoot)
    let calls = 0

    const status = runTestDurationProfile(
      projectRoot,
      parseProfileArguments(["--output", "reports/test-profile/current.json"]),
      () => {
        calls++
        return { status: 7 }
      }
    )

    expect(status).toBe(7)
    expect(calls).toBe(1)
    expect(fs.existsSync(join(projectRoot, "reports/test-profile/current.json"))).toBe(false)
  })
})
