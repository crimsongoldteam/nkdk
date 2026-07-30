import { spawnSync } from "node:child_process"
import { existsSync, readFileSync, rmSync, statSync } from "node:fs"
import { isAbsolute, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const reportNamePattern = /^[a-z0-9][a-z0-9-]*$/u

export function parseMutationArguments(argv) {
  const args = argv[0] === "--" ? argv.slice(1) : argv
  if (args[0] !== "--report" || args[1] === undefined) {
    throw new Error("Использование: pnpm test:mutation -- --report <имя> <production-файл...>")
  }
  const reportName = args[1]
  if (!reportNamePattern.test(reportName)) {
    throw new Error(`Некорректное имя отчёта: ${reportName}`)
  }
  const files = args.slice(2)
  if (files.length === 0) throw new Error("Не указаны production-файлы")
  return { reportName, files }
}

export function validateMutationFiles(projectRoot, files, fileExists = existsSync) {
  return files.map((file) => {
    const absolute = resolve(projectRoot, file)
    const projectPath = relative(projectRoot, absolute).replace(/\\/gu, "/")
    const segments = projectPath.split("/")
    const invalid =
      projectPath.startsWith("../") ||
      isAbsolute(projectPath) ||
      !projectPath.startsWith("packages/") ||
      !projectPath.endsWith(".ts") ||
      projectPath.endsWith(".d.ts") ||
      /\.(?:test|spec)\.ts$/u.test(projectPath) ||
      segments.includes("__fixtures__") ||
      segments.includes("generated") ||
      !fileExists(absolute)
    if (invalid) throw new Error(`Недопустимая цель mutation testing: ${file}`)
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
  rmSync(reportPath, { force: true })
  rmSync(resolve(projectRoot, "reports/stryker", `${options.reportName}.html`), { force: true })
  const status =
    spawnSync("pnpm", ["exec", "stryker", "run", "--mutate", files.join(",")], {
      cwd: projectRoot,
      stdio: "inherit",
      env: { ...process.env, NKDK_STRYKER_REPORT_NAME: options.reportName },
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
