import { describe, expect, it } from "vitest"
// @ts-expect-error CLI-модуль остаётся исполняемым JavaScript без отдельной декларации типов.
import { findSlowTests } from "./assert-test-durations.mjs"

describe("findSlowTests", () => {
  it("accepts the exact limit and returns slower tests in descending order", () => {
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

    expect(findSlowTests(report, 50)).toEqual([
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
})
