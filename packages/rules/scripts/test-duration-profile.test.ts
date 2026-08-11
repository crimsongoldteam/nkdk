import { describe, expect, it } from "vitest"
// @ts-expect-error CLI-модуль остаётся JavaScript без декларации типов.
import { collectTestDurationProfile } from "./test-duration-profile.mjs"

const report = (root: string, durations: number[]) => ({
  testResults: [{
    name: `${root}/packages/rules/example.test.ts`,
    assertionResults: durations.map((duration, index) => ({
      fullName: `example case ${index}`,
      duration,
    })),
  }],
})

describe("test duration profile", () => {
  it("normalizes worktree paths and calculates median, maximum and exceedances", () => {
    const reports = [
      report("/worktree-a", [8]),
      report("/worktree-a", [30]),
      report("/worktree-a", [12]),
    ]

    expect(collectTestDurationProfile(reports, {
      projectRoot: "/worktree-a",
      thresholdMs: 10,
    })).toEqual([{
      id: "packages/rules/example.test.ts::example case 0",
      file: "packages/rules/example.test.ts",
      name: "example case 0",
      durationsMs: [8, 30, 12],
      medianMs: 12,
      maxMs: 30,
      exceedances: 2,
    }])
  })

  it("keeps the union of tests exceeding the threshold in any run", () => {
    const reports = [
      report("/project", [11, 1]),
      report("/project", [1, 12]),
      report("/project", [1, 1]),
    ]

    expect(collectTestDurationProfile(reports, {
      projectRoot: "/project",
      thresholdMs: 10,
    }).map(({ name }: { name: string }) => name)).toEqual(["example case 0", "example case 1"])
  })

  it("rejects reports with different test identities", () => {
    const reports = [
      report("/project", [11]),
      report("/project", [11, 12]),
      report("/project", [11]),
    ]

    expect(() => collectTestDurationProfile(reports, {
      projectRoot: "/project",
      thresholdMs: 10,
    })).toThrow("Наборы тестов в отчётах различаются")
  })
})
