import { describe, expect, it } from "vitest"
// @ts-expect-error CLI-модуль остаётся исполняемым JavaScript без отдельной декларации типов.
import { analyzeTestDurationReport, parseArguments, readTestDurationReports } from "./assert-test-durations.mjs"

const report = ({ testMs }: { testMs: number }) => ({
  success: true,
  numTotalTests: 1,
  numPassedTests: 1,
  numFailedTests: 0,
  numPendingTests: 0,
  numTodoTests: 0,
  testResults: [{
    name: "/project/packages/core/example.test.ts",
    startTime: 0,
    endTime: 99_999,
    assertionResults: [{
      fullName: "example test case",
      duration: testMs,
    }],
  }],
})

const lifecycleReport = (fileMs: number, packageSetupMs = 3_000) => ({
  packageSetupDuration: packageSetupMs,
  testFiles: [{
    file: "/project/packages/core/example.test.ts",
    duration: fileMs,
  }],
})

describe("assert test durations", () => {
  it("разделяет целевые предупреждения и жёсткие превышения на границах", () => {
    expect(analyzeTestDurationReport(report({ testMs: 10 }), lifecycleReport(1_000))).toEqual({
      warnings: [],
      failures: [],
    })
    expect(analyzeTestDurationReport(report({ testMs: 10.01 }), lifecycleReport(1_000)).warnings).toHaveLength(1)
    expect(analyzeTestDurationReport(report({ testMs: 50.01 }), lifecycleReport(1_000)).failures).toHaveLength(1)
    expect(analyzeTestDurationReport(report({ testMs: 10 }), lifecycleReport(1_000.01)).failures).toHaveLength(1)
    expect(analyzeTestDurationReport(report({ testMs: 10 }), lifecycleReport(1_000, 3_000.01)).failures).toEqual([{
      type: "setup",
      duration: 3_000.01,
    }])
  })

  it("учитывает замедление стандартного CI runner для жёстких лимитов", () => {
    const slowReport = report({ testMs: 80 })
    const slowLifecycleReport = lifecycleReport(1_900, 5_700)

    expect(analyzeTestDurationReport(slowReport, slowLifecycleReport).failures).toHaveLength(3)
    expect(analyzeTestDurationReport(slowReport, slowLifecycleReport, { CI: "true" }).failures).toEqual([])
  })

  it("учитывает системное замедление Windows для жёстких лимитов", () => {
    expect(analyzeTestDurationReport(
      report({ testMs: 200 }),
      lifecycleReport(4_500, 14_500),
      { platform: "win32" },
    ).failures).toEqual([])
  })

  it("сортирует предупреждения и превышения по убыванию длительности", () => {
    const result = analyzeTestDurationReport({
      success: true,
      numTotalTests: 4,
      numPassedTests: 4,
      numFailedTests: 0,
      numPendingTests: 0,
      numTodoTests: 0,
      testResults: [
        {
          name: "/project/first.test.ts",
          assertionResults: [
            { fullName: "first warning", duration: 11 },
            { fullName: "first failure", duration: 60 },
          ],
        },
        {
          name: "/project/second.test.ts",
          assertionResults: [
            { fullName: "second warning", duration: 20 },
            { fullName: "second failure", duration: 80 },
          ],
        },
      ],
    }, {
      packageSetupDuration: 3_500,
      testFiles: [
        { file: "/project/first.test.ts", duration: 1_100 },
        { file: "/project/second.test.ts", duration: 1_200 },
      ],
    })

    expect(result.warnings.map(({ duration }: { duration: number }) => duration)).toEqual([20, 11])
    expect(result.failures.map(({ duration }: { duration: number }) => duration)).toEqual([3_500, 1_200, 1_100, 80, 60])
  })

  it("отклоняет повреждённый JSON-отчёт", () => {
    expect(() => analyzeTestDurationReport({ testResults: [{ assertionResults: [] }] }, lifecycleReport(1))).toThrow()
  })

  it("не требует длительность у пропущенного теста", () => {
    const skippedReport = {
      success: true,
      numTotalTests: 1,
      numPassedTests: 0,
      numFailedTests: 0,
      numPendingTests: 1,
      numTodoTests: 0,
      testResults: [{
        name: "/project/packages/core/example.test.ts",
        assertionResults: [{ fullName: "optional integration", status: "skipped" }],
      }],
    }

    expect(analyzeTestDurationReport(skippedReport, lifecycleReport(1))).toEqual({
      warnings: [],
      failures: [],
    })
  })

  it("отклоняет неполный отчёт и отсутствие файла", () => {
    expect(() => analyzeTestDurationReport({
      success: true,
      numTotalTests: 1,
      numPassedTests: 1,
      numFailedTests: 0,
      numPendingTests: 0,
      numTodoTests: 0,
      testResults: [],
    }, { testFiles: [] })).toThrow()
    expect(() => analyzeTestDurationReport(report({ testMs: 1 }), {
      testFiles: [{ file: "/project/packages/core/example.test.ts", duration: 1 }],
    })).toThrow("setup")
    expect(() => readTestDurationReports({
      report: "/definitely/missing/case-report.json",
      lifecycleReport: "/definitely/missing/lifecycle-report.json",
    })).toThrow()
  })

  it("не позволяет изменить лимит параметром командной строки", () => {
    expect(() => parseArguments(["--report", "result.json", "--max-ms", "100"])).toThrow()
  })

  it("требует отдельный lifecycle-отчёт", () => {
    expect(parseArguments([
      "--report", "result.json",
      "--lifecycle-report", "lifecycle.json",
    ])).toEqual({ report: "result.json", lifecycleReport: "lifecycle.json" })
  })
})
