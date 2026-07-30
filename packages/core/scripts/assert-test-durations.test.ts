import { describe, expect, it } from "vitest"
// @ts-expect-error CLI-модуль остаётся исполняемым JavaScript без отдельной декларации типов.
import { findSlowTests, parseArguments, TEST_DURATION_BUDGET_MS } from "./assert-test-durations.mjs"

describe("findSlowTests", () => {
  it("uses the immutable 50 ms limit and returns slower tests in descending order", () => {
    const report = {
      testResults: [{
        name: "/project/slow.test.ts",
        assertionResults: [
          { fullName: "suite exact", duration: 50 },
          { fullName: "suite slower", duration: 50.01 },
          { fullName: "suite slowest", duration: 75 },
        ],
      }],
    }

    expect(TEST_DURATION_BUDGET_MS).toBe(50)
    expect(findSlowTests(report)).toEqual([
      {
        file: "/project/slow.test.ts",
        name: "suite slowest",
        duration: 75,
      },
      {
        file: "/project/slow.test.ts",
        name: "suite slower",
        duration: 50.01,
      },
    ])
  })

  it("rejects attempts to override the duration limit", () => {
    expect(() =>
      parseArguments(["--report", "report.json", "--max-ms", "100"])
    ).toThrow("Неизвестный параметр: --max-ms")
  })
})
