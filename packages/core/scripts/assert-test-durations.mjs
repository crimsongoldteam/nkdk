import fs from "node:fs"
import { relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

export const TEST_DURATION_TARGET_MS = 10
export const TEST_FILE_LIMIT_MS = 1_000
export const TEST_PACKAGE_SETUP_LIMIT_MS = 3_000
export const WINDOWS_LIMIT_MULTIPLIER = 5

export function analyzeTestDurationReport(report, lifecycleReport, environment = {}) {
  assertTestDurationReport(report)
  const { lifecycleByFile, packageSetupDuration } = parseLifecycleReport(lifecycleReport, report.testResults)
  const limitMultiplier = Math.max(
    environment.CI === "true" ? 3 : 1,
    environment.platform === "win32" ? WINDOWS_LIMIT_MULTIPLIER : 1,
  )

  const warnings = []
  const failures = []
  if (packageSetupDuration > TEST_PACKAGE_SETUP_LIMIT_MS * limitMultiplier) {
    failures.push({ type: "setup", duration: packageSetupDuration })
  }
  for (const suite of report.testResults) {
    const fileDuration = lifecycleByFile.get(suite.name)
    if (fileDuration > TEST_FILE_LIMIT_MS * limitMultiplier) {
      failures.push({ type: "file", file: suite.name, duration: fileDuration })
    }

    for (const test of suite.assertionResults) {
      if (!assertTest(test)) continue
      const result = { type: "test", file: suite.name, name: test.fullName, duration: test.duration }
      if (test.duration > TEST_DURATION_TARGET_MS) warnings.push(result)
    }
  }

  return {
    warnings: sortByDuration(warnings),
    failures: sortByDuration(failures),
  }
}

export function readTestDurationReports(options) {
  return {
    report: readJsonReport(options.report, "test case"),
    lifecycleReport: readJsonReport(options.lifecycleReport, "lifecycle test file"),
  }
}

export function runTestDurationAssertion(options) {
  const { report, lifecycleReport } = readTestDurationReports(options)
  const { warnings, failures } = analyzeTestDurationReport(report, lifecycleReport, {
    ...process.env,
    platform: process.platform,
  })
  for (const warning of warnings) process.stdout.write(`Цель 10ms превышена: ${formatResult(warning)}\n`)
  for (const failure of failures) process.stderr.write(`Лимит превышен: ${formatResult(failure)}\n`)
  return failures.length === 0 ? 0 : 1
}

function assertTestDurationReport(report) {
  if (report === null || typeof report !== "object" || !Array.isArray(report.testResults) || report.success !== true) {
    throw new Error("Отчёт Vitest не содержит массив testResults")
  }

  const counters = [
    "numTotalTests",
    "numPassedTests",
    "numFailedTests",
    "numPendingTests",
    "numTodoTests",
  ]
  for (const counter of counters) {
    if (!Number.isInteger(report[counter]) || report[counter] < 0) {
      throw new Error(`Отчёт Vitest содержит некорректный счётчик ${counter}`)
    }
  }
  if (report.numTotalTests !== report.numPassedTests + report.numFailedTests + report.numPendingTests + report.numTodoTests) {
    throw new Error("Счётчики test cases в отчёте Vitest не совпадают")
  }

  const assertions = report.testResults.reduce((count, suite) => {
    assertSuite(suite)
    return count + suite.assertionResults.length
  }, 0)
  if (report.numTotalTests !== assertions) {
    throw new Error("Количество test cases в отчёте Vitest не совпадает с assertionResults")
  }
}

function parseLifecycleReport(report, suites) {
  if (report === null || typeof report !== "object" || !Array.isArray(report.testFiles) ||
    !isFiniteNumber(report.packageSetupDuration) || report.packageSetupDuration < 0) {
    throw new Error("Отчёт lifecycle не содержит корректный setup пакета и массив testFiles")
  }

  const durations = new Map()
  for (const testFile of report.testFiles) {
    if (testFile === null || typeof testFile !== "object" ||
      typeof testFile.file !== "string" || testFile.file === "" ||
      !isFiniteNumber(testFile.duration) || testFile.duration < 0 || durations.has(testFile.file)) {
      throw new Error("Отчёт lifecycle содержит повреждённый test file")
    }
    durations.set(testFile.file, testFile.duration)
  }
  if (durations.size !== suites.length || suites.some((suite) => !durations.has(suite.name))) {
    throw new Error("Отчёты Vitest и lifecycle содержат разные test files")
  }
  return { lifecycleByFile: durations, packageSetupDuration: report.packageSetupDuration }
}

function readJsonReport(path, label) {
  try {
    return JSON.parse(fs.readFileSync(path, "utf8"))
  } catch (error) {
    throw new Error(`Не удалось прочитать ${label} отчёт: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function assertSuite(suite) {
  if (suite === null || typeof suite !== "object" ||
    typeof suite.name !== "string" || suite.name === "" ||
    !Array.isArray(suite.assertionResults)) {
    throw new Error("Отчёт Vitest содержит повреждённый test result")
  }
}

function assertTest(test) {
  if (test === null || typeof test !== "object" ||
    typeof test.fullName !== "string" || test.fullName === "") {
    throw new Error("Отчёт Vitest содержит повреждённый assertion result")
  }
  if (test.status === "skipped" || test.status === "pending" || test.status === "todo") return false
  if (!isFiniteNumber(test.duration) || test.duration < 0) {
    throw new Error("Отчёт Vitest содержит повреждённый assertion result")
  }
  return true
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value)
}

function sortByDuration(results) {
  return results.sort((left, right) =>
    right.duration - left.duration ||
    (left.file ?? "").localeCompare(right.file ?? "") ||
    (left.name ?? "").localeCompare(right.name ?? "")
  )
}

function formatResult(result) {
  if (result.type === "setup") return `${result.duration.toFixed(2)}ms setup пакета`
  const file = relative(process.cwd(), result.file)
  const name = result.type === "file" ? "файл теста" : result.name
  return `${result.duration.toFixed(2)}ms ${file} > ${name}`
}

function run() {
  const { report: reportPath, lifecycleReport } = parseArguments(process.argv.slice(2))
  return runTestDurationAssertion({
    report: reportPath,
    lifecycleReport,
  })
}

export function parseArguments(argv) {
  const args = argv[0] === "--" ? argv.slice(1) : argv
  if (args.length !== 4 || args[0] !== "--report" || args[1] === "" ||
    args[2] !== "--lifecycle-report" || args[3] === "") {
    throw new Error("Использование: node packages/core/scripts/assert-test-durations.mjs --report <path> --lifecycle-report <path>")
  }
  return { report: args[1], lifecycleReport: args[3] }
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    process.exitCode = run()
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
