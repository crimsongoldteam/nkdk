import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { assertStableMutationReport } from "./run-mutation-tests.mjs"

const reportNamePattern = /^[a-z0-9][a-z0-9-]*$/u

function mutantKey(file, mutant) {
  return JSON.stringify([
    file,
    mutant.mutatorName,
    mutant.replacement,
    mutant.location?.start,
    mutant.location?.end,
  ])
}

export function compareMutationReports(before, after) {
  assertStableMutationReport(before)
  assertStableMutationReport(after)
  const beforeFiles = Object.keys(before.files ?? {}).sort()
  const afterFiles = Object.keys(after.files ?? {}).sort()
  if (JSON.stringify(beforeFiles) !== JSON.stringify(afterFiles)) {
    throw new Error("Production-файлы отчётов различаются")
  }
  for (const file of beforeFiles) {
    if (before.files[file].source !== after.files[file].source) {
      throw new Error(`Production-исходники отчётов различаются: ${file}`)
    }
  }
  const afterMutants = new Map(
    afterFiles.flatMap((file) =>
      after.files[file].mutants.map((mutant) => [mutantKey(file, mutant), mutant])
    )
  )
  const regressions = []
  const improvements = []
  let preserved = 0
  for (const file of beforeFiles) {
    for (const mutant of before.files[file].mutants) {
      const current = afterMutants.get(mutantKey(file, mutant))
      if (mutant.status === "Killed") {
        if (current?.status === "Killed") preserved += 1
        else regressions.push({ file, mutant, currentStatus: current?.status ?? "Missing" })
      } else if (current?.status === "Killed") {
        improvements.push({ file, mutant })
      }
    }
  }
  return { preserved, improvements, regressions }
}

export function parseReportNames(argv) {
  const names = argv[0] === "--" ? argv.slice(1) : argv
  if (names.length !== 2 || names.some((name) => !reportNamePattern.test(name))) {
    throw new Error("Использование: pnpm test:mutation:compare -- <до> <после>")
  }
  return names
}

function readReport(name) {
  return JSON.parse(readFileSync(resolve("reports/stryker", `${name}.json`), "utf8"))
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    const [beforeName, afterName] = parseReportNames(process.argv.slice(2))
    const result = compareMutationReports(readReport(beforeName), readReport(afterName))
    process.stdout.write(
      `Сохранено обнаруживаемых мутантов: ${result.preserved}; новых обнаруживаемых: ${result.improvements.length}\n`
    )
    for (const regression of result.regressions) {
      process.stderr.write(
        `Потерян обнаруживаемый мутант: ${regression.file} #${regression.mutant.id} → ${regression.currentStatus}\n`
      )
    }
    if (result.regressions.length > 0) process.exitCode = 1
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
