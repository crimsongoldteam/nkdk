import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
// @ts-expect-error CLI-модуль остаётся JavaScript без декларации типов.
import { parseProfileArguments, runTestDurationProfile } from "./run-test-duration-profile.mjs"

const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true })
  }
})

describe("run test duration profile", () => {
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
      (_command: string, args: string[]) => {
        const seed = args.find((argument) => argument.startsWith("--sequence.seed="))!.split("=")[1]!
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
