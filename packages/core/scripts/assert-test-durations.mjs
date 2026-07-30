import fs from "node:fs"
import { relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

export const TEST_DURATION_BUDGET_MS = 50

export function findSlowTests(report) {
  return report.testResults
    .flatMap((suite) =>
      suite.assertionResults.map((test) => ({
        file: suite.name,
        name: test.fullName,
        duration: test.duration ?? 0,
      }))
    )
    .filter((test) => test.duration > TEST_DURATION_BUDGET_MS)
    .sort((left, right) => right.duration - left.duration)
}

export function parseArguments(argv) {
  const allowed = new Set(["--report", "--files-from"])
  const values = new Map()
  for (let index = 0; index < argv.length; index += 2) {
    const name = argv[index]
    const value = argv[index + 1]
    if (!name?.startsWith("--") || value === undefined) {
      throw new Error(`Ожидалась пара --параметр значение: ${name ?? ""}`)
    }
    if (!allowed.has(name)) throw new Error(`Неизвестный параметр: ${name}`)
    values.set(name, value)
  }
  const report = values.get("--report")
  if (report === undefined) throw new Error("Не указан --report")
  return {
    report,
    filesFrom: values.get("--files-from"),
  }
}

function selectedFiles(path) {
  if (path === undefined) return undefined
  return new Set(
    fs.readFileSync(path, "utf8")
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => resolve(line))
  )
}

function run() {
  try {
    const options = parseArguments(process.argv.slice(2))
    const report = JSON.parse(fs.readFileSync(options.report, "utf8"))
    const files = selectedFiles(options.filesFrom)
    const violations = findSlowTests(report)
      .filter((test) => files === undefined || files.has(resolve(test.file)))

    for (const violation of violations) {
      const file = relative(process.cwd(), violation.file)
      process.stderr.write(`${violation.duration.toFixed(2)}ms ${file} > ${violation.name}\n`)
    }
    if (violations.length > 0) process.exitCode = 1
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  run()
}
