import { spawnSync } from "node:child_process"
import { existsSync, readFileSync, rmSync, statSync } from "node:fs"
import { isAbsolute, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const reportNamePattern = /^[a-z0-9][a-z0-9-]*$/u
const mutationRangePattern = /(:[1-9]\d*(?::\d+)?-[1-9]\d*(?::\d+)?)$/u

export function parseMutationArguments(argv) {
  const args = argv[0] === "--" ? argv.slice(1) : argv
  if (args[0] !== "--report" || args[1] === undefined) {
    throw new Error(
      "Использование: pnpm test:mutation -- --report <имя> [--tests <test-файлы через запятую>] <production-файл...>"
    )
  }
  const reportName = args[1]
  if (!reportNamePattern.test(reportName)) {
    throw new Error(`Некорректное имя отчёта: ${reportName}`)
  }
  const hasTestFiles = args[2] === "--tests"
  const testFiles = hasTestFiles ? args[3]?.split(",").filter(Boolean) : undefined
  if (hasTestFiles && (testFiles === undefined || testFiles.length === 0)) {
    throw new Error("Не указаны тестовые файлы после --tests")
  }
  const files = args.slice(hasTestFiles ? 4 : 2)
  if (files.length === 0) throw new Error("Не указаны production-файлы")
  return testFiles === undefined ? { reportName, files } : { reportName, testFiles, files }
}

export function validateMutationFiles(projectRoot, files, fileExists = existsSync) {
  return files.map((file) => {
    const range = file.match(mutationRangePattern)?.[1] ?? ""
    const sourceFile = range === "" ? file : file.slice(0, -range.length)
    const absolute = resolve(projectRoot, sourceFile)
    const projectPath = relative(projectRoot, absolute).replace(/\\/gu, "/")
    const segments = projectPath.split("/")
    const invalid =
      projectPath.startsWith("../") ||
      isAbsolute(projectPath) ||
      !projectPath.startsWith("packages/") ||
      !/\.(?:ts|mjs)$/u.test(projectPath) ||
      projectPath.endsWith(".d.ts") ||
      /\.(?:test|spec)\.(?:ts|mjs)$/u.test(projectPath) ||
      segments.includes("__fixtures__") ||
      segments.includes("generated") ||
      !fileExists(absolute)
    if (invalid) throw new Error(`Недопустимая цель mutation testing: ${file}`)
    return `${projectPath}${range}`
  })
}

export function validateMutationTestFiles(projectRoot, files, fileExists = existsSync) {
  return files.map((file) => {
    const absolute = resolve(projectRoot, file)
    const projectPath = relative(projectRoot, absolute).replace(/\\/gu, "/")
    const segments = projectPath.split("/")
    const invalid =
      projectPath.startsWith("../") ||
      isAbsolute(projectPath) ||
      !projectPath.startsWith("packages/core/") ||
      !/\.(?:test|spec)\.ts$/u.test(projectPath) ||
      segments.includes("__fixtures__") ||
      segments.includes("generated") ||
      !fileExists(absolute)
    if (invalid) throw new Error(`Недопустимый тестовый файл mutation testing: ${file}`)
    return projectPath
  })
}

export function assertStableMutationReport(report) {
  const unreliableStatuses = new Map()
  for (const file of Object.values(report.files ?? {})) {
    for (const mutant of file.mutants ?? []) {
      if (["Timeout", "RuntimeError", "CompileError"].includes(mutant.status)) {
        unreliableStatuses.set(mutant.status, (unreliableStatuses.get(mutant.status) ?? 0) + 1)
      }
    }
  }
  if (unreliableStatuses.size > 0) {
    const summary = [...unreliableStatuses].map(([status, count]) => `${status}=${count}`).join(", ")
    throw new Error(`Недостоверный mutation-отчёт: ${summary}`)
  }
}

export function runMutationTests(projectRoot, options) {
  const files = validateMutationFiles(
    projectRoot,
    options.files,
    (file) => existsSync(file) && statSync(file).isFile()
  )
  const reportPath = resolve(projectRoot, "reports/stryker", `${options.reportName}.json`)
  const testFiles = validateMutationTestFiles(
    projectRoot,
    options.testFiles ?? [],
    (file) => existsSync(file) && statSync(file).isFile()
  )
  rmSync(reportPath, { force: true })
  rmSync(resolve(projectRoot, "reports/stryker", `${options.reportName}.html`), { force: true })
  const status =
    spawnSync("pnpm", ["exec", "stryker", "run", "--mutate", files.join(",")], {
      cwd: projectRoot,
      stdio: "inherit",
      env: {
        ...process.env,
        NKDK_STRYKER_REPORT_NAME: options.reportName,
        NKDK_MUTATION_SOURCE_ROOT: projectRoot,
        ...(testFiles.length > 0
          ? { NKDK_STRYKER_TEST_FILES: testFiles.join(",") }
          : {}),
      },
    }).status ?? 1
  if (status !== 0) return status
  assertStableMutationReport(JSON.parse(readFileSync(reportPath, "utf8")))
  return 0
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    process.exitCode = runMutationTests(process.cwd(), parseMutationArguments(process.argv.slice(2)))
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
