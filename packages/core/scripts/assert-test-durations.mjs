import fs from "node:fs"
import { relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

export function findSlowTests(report, maxMs) {
  return report.testResults
    .flatMap((suite) =>
      suite.assertionResults.map((test) => ({
        file: suite.name,
        name: test.fullName,
        duration: test.duration ?? 0,
      }))
    )
    .filter((test) => test.duration > maxMs)
    .sort((left, right) => right.duration - left.duration)
}

function parseArguments(argv) {
  const values = new Map()
  for (let index = 0; index < argv.length; index += 2) {
    const name = argv[index]
    const value = argv[index + 1]
    if (!name?.startsWith("--") || value === undefined) {
      throw new Error(`Ожидалась пара --параметр значение: ${name ?? ""}`)
    }
    values.set(name, value)
  }
  const report = values.get("--report")
  const maxMs = Number(values.get("--max-ms"))
  if (report === undefined) throw new Error("Не указан --report")
  if (!Number.isFinite(maxMs) || maxMs <= 0) throw new Error("--max-ms должен быть положительным числом")
  return {
    report,
    maxMs,
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
    const violations = findSlowTests(report, options.maxMs)
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
