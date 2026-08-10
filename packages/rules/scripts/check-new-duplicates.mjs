import { spawnSync } from "node:child_process"
import fs from "node:fs"
import { relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const usage = "Использование: pnpm check:duplicates -- --base <commit>"

export function parseArguments(argv) {
  const args = argv[0] === "--" ? argv.slice(1) : argv
  if (args.length !== 2 || args[0] !== "--base" || args[1] === "") {
    throw new Error(usage)
  }
  return { base: args[1] }
}

export function parseAddedLineRanges(diff) {
  const ranges = []
  let path

  for (const line of diff.split("\n")) {
    if (line.startsWith("+++ ")) {
      const fileName = line.slice(4)
      path = fileName === "/dev/null" ? undefined : normalizePath(fileName)
      continue
    }

    const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/u)
    if (path === undefined || hunk === null) continue
    const start = Number(hunk[1])
    const count = hunk[2] === undefined ? 1 : Number(hunk[2])
    if (count > 0) ranges.push({ path, start, end: start + count - 1 })
  }

  return ranges
}

export function parseJscpdReport(report) {
  if (report === null || typeof report !== "object" || !Array.isArray(report.duplicates)) {
    throw new Error("Отчёт jscpd не содержит массив duplicates")
  }
  for (const clone of report.duplicates) {
    if (clone === null || typeof clone !== "object" || !isCloneSide(clone.firstFile)) {
      throw new Error("Клон jscpd не содержит firstFile")
    }
    if (!isCloneSide(clone.secondFile)) {
      throw new Error("Клон jscpd не содержит корректный secondFile")
    }
  }
  return report
}

export function rangesIntersect(left, right) {
  return left.path === right.path && left.start <= right.end && right.start <= left.end
}

export function findNewClones(report, addedRanges, projectRoot) {
  return parseClones(report, projectRoot)
    .filter((clone) => [clone.left, clone.right].some((side) =>
      addedRanges.some((added) => rangesIntersect(side, added))
    ))
    .map(formatClone)
}

export function runDuplicateCheck(projectRoot, options, spawn = spawnSync) {
  const baseCheck = spawn("git", ["cat-file", "-e", `${options.base}^{commit}`], {
    cwd: projectRoot,
    stdio: "ignore",
  })
  if (baseCheck.status !== 0) throw new Error(`Не найден базовый коммит: ${options.base}`)

  const diff = spawn("git", ["diff", "--unified=0", "--find-renames", options.base, "--"], {
    cwd: projectRoot,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  })
  if (diff.status !== 0) throw new Error(`Не удалось получить diff относительно ${options.base}`)

  const reportDirectory = resolve(projectRoot, "reports/jscpd")
  fs.rmSync(reportDirectory, { recursive: true, force: true })
  const jscpd = spawn("pnpm", ["exec", "jscpd", "--config", ".jscpd.json", "packages"], {
    cwd: projectRoot,
    stdio: "inherit",
  })
  if (jscpd.status !== 0) return jscpd.status ?? 1

  const reportPath = resolve(reportDirectory, "jscpd-report.json")
  let report
  try {
    report = JSON.parse(fs.readFileSync(reportPath, "utf8"))
  } catch (error) {
    throw new Error(`Не удалось прочитать JSON-отчёт jscpd: ${error instanceof Error ? error.message : String(error)}`)
  }

  const newClones = findNewClones(
    parseJscpdReport(report),
    parseAddedLineRanges(String(diff.stdout ?? "")),
    projectRoot
  )
  for (const clone of newClones) process.stdout.write(`${clone}\n`)
  return newClones.length === 0 ? 0 : 1
}

function parseClones(report, projectRoot) {
  return parseJscpdReport(report).duplicates.map((clone) => ({
    left: normalizeCloneSide(clone.firstFile, projectRoot),
    right: normalizeCloneSide(clone.secondFile, projectRoot),
  }))
}

function normalizeCloneSide(side, projectRoot) {
  return {
    path: normalizePath(side.name, projectRoot),
    start: side.start,
    end: side.end,
  }
}

function normalizePath(path, projectRoot) {
  const portablePath = path.replace(/\\/gu, "/")
  const relativePath = projectRoot === undefined ? portablePath : relative(projectRoot, portablePath)
  return relativePath.replace(/\\/gu, "/").replace(/^\.\//u, "").replace(/^[ab]\//u, "")
}

function isCloneSide(side) {
  return side !== null &&
    typeof side === "object" &&
    typeof side.name === "string" && side.name !== "" &&
    Number.isInteger(side.start) && side.start > 0 &&
    Number.isInteger(side.end) && side.end >= side.start
}

function formatClone(clone) {
  return `${clone.left.path}:${clone.left.start}-${clone.left.end} <-> ${clone.right.path}:${clone.right.start}-${clone.right.end}`
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    process.exitCode = runDuplicateCheck(process.cwd(), parseArguments(process.argv.slice(2)))
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
