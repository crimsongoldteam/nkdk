import fs from "node:fs"
import { relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

export const TEST_DURATION_TARGET_MS = 10
export const TEST_DURATION_LIMIT_MS = 50
export const TEST_FILE_LIMIT_MS = 1_000

export function analyzeTestDurationReport(report) {
  if (report === null || typeof report !== "object" || !Array.isArray(report.testResults)) {
    throw new Error("Отчёт Vitest не содержит массив testResults")
  }

  const warnings = []
  const failures = []
  for (const suite of report.testResults) {
    assertSuite(suite)
    const fileDuration = suite.endTime - suite.startTime
    if (fileDuration > TEST_FILE_LIMIT_MS) {
      failures.push({ type: "file", file: suite.name, duration: fileDuration })
    }

    for (const test of suite.assertionResults) {
      assertTest(test)
      const result = { type: "test", file: suite.name, name: test.fullName, duration: test.duration }
      if (test.duration > TEST_DURATION_LIMIT_MS) failures.push(result)
      else if (test.duration > TEST_DURATION_TARGET_MS) warnings.push(result)
    }
  }

  return {
    warnings: sortByDuration(warnings),
    failures: sortByDuration(failures),
  }
}

export function parseArguments(argv) {
  const args = argv[0] === "--" ? argv.slice(1) : argv
  if (args.length !== 2 || args[0] !== "--report" || args[1] === "") {
    throw new Error("Использование: node packages/core/scripts/assert-test-durations.mjs --report <path>")
  }
  return { report: args[1] }
}

function assertSuite(suite) {
  if (suite === null || typeof suite !== "object" ||
    typeof suite.name !== "string" || suite.name === "" ||
    !Array.isArray(suite.assertionResults) ||
    !isFiniteNumber(suite.startTime) || !isFiniteNumber(suite.endTime) ||
    suite.endTime < suite.startTime) {
    throw new Error("Отчёт Vitest содержит повреждённый test result")
  }
}

function assertTest(test) {
  if (test === null || typeof test !== "object" ||
    typeof test.fullName !== "string" || test.fullName === "" ||
    !isFiniteNumber(test.duration) || test.duration < 0) {
    throw new Error("Отчёт Vitest содержит повреждённый assertion result")
  }
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value)
}

function sortByDuration(results) {
  return results.sort((left, right) =>
    right.duration - left.duration ||
    left.file.localeCompare(right.file) ||
    (left.name ?? "").localeCompare(right.name ?? "")
  )
}

function formatResult(result) {
  const file = relative(process.cwd(), result.file)
  const name = result.type === "file" ? "файл теста" : result.name
  return `${result.duration.toFixed(2)}ms ${file} > ${name}`
}

function run() {
  const { report: reportPath } = parseArguments(process.argv.slice(2))
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"))
  const { warnings, failures } = analyzeTestDurationReport(report)
  for (const warning of warnings) process.stdout.write(`Цель 10ms превышена: ${formatResult(warning)}\n`)
  for (const failure of failures) process.stderr.write(`Лимит превышен: ${formatResult(failure)}\n`)
  return failures.length === 0 ? 0 : 1
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    process.exitCode = run()
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
