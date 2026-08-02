import { describe, expect, it } from "vitest"
// @ts-expect-error CLI-модуль остаётся исполняемым JavaScript без отдельной декларации типов.
import { analyzeTestDurationReport, parseArguments } from "./assert-test-durations.mjs"

const report = ({ testMs, fileMs }: { testMs: number; fileMs: number }) => ({
  testResults: [{
    name: "/project/packages/core/example.test.ts",
    startTime: 1_000,
    endTime: 1_000 + fileMs,
    assertionResults: [{
      fullName: "example test case",
      duration: testMs,
    }],
  }],
})

describe("assert test durations", () => {
  it("разделяет целевые предупреждения и жёсткие превышения на границах", () => {
    expect(analyzeTestDurationReport(report({ testMs: 10, fileMs: 1_000 }))).toEqual({
      warnings: [],
      failures: [],
    })
    expect(analyzeTestDurationReport(report({ testMs: 10.01, fileMs: 1_000 })).warnings).toHaveLength(1)
    expect(analyzeTestDurationReport(report({ testMs: 50.01, fileMs: 1_000 })).failures).toHaveLength(1)
    expect(analyzeTestDurationReport(report({ testMs: 10, fileMs: 1_000.01 })).failures).toHaveLength(1)
  })

  it("сортирует предупреждения и превышения по убыванию длительности", () => {
    const result = analyzeTestDurationReport({
      testResults: [
        {
          name: "/project/first.test.ts",
          startTime: 0,
          endTime: 1_100,
          assertionResults: [
            { fullName: "first warning", duration: 11 },
            { fullName: "first failure", duration: 60 },
          ],
        },
        {
          name: "/project/second.test.ts",
          startTime: 0,
          endTime: 1_200,
          assertionResults: [
            { fullName: "second warning", duration: 20 },
            { fullName: "second failure", duration: 80 },
          ],
        },
      ],
    })

    expect(result.warnings.map(({ duration }: { duration: number }) => duration)).toEqual([20, 11])
    expect(result.failures.map(({ duration }: { duration: number }) => duration)).toEqual([1_200, 1_100, 80, 60])
  })

  it("отклоняет повреждённый JSON-отчёт", () => {
    expect(() => analyzeTestDurationReport({ testResults: [{ assertionResults: [] }] })).toThrow()
  })

  it("не позволяет изменить лимит параметром командной строки", () => {
    expect(() => parseArguments(["--report", "result.json", "--max-ms", "100"])).toThrow()
  })
})
