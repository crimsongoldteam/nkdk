import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, mkdirSync } from "node:fs"
import { mkdtemp, mkdir, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

const SOURCE_PATHS = ["packages", "scripts"]

function normalizeFragment(fragment) {
  return fragment.replaceAll("\r\n", "\n").replaceAll(/\s+$/gm, "")
}

function fileRange(file) {
  const start = file.start?.line ?? file.start ?? 1
  const end = file.end?.line ?? file.end ?? start
  return { start, end }
}

async function readCloneFragment(clone, side, sourceRoot) {
  const direct = side === "first" ? clone.duplicationA : clone.duplicationB
  if (typeof direct === "string") return normalizeFragment(direct)

  const file = side === "first" ? clone.firstFile : clone.secondFile
  const fileName = resolve(sourceRoot, file.name)
  const source = await readFile(fileName, "utf8")
  const { start, end } = fileRange(file)
  return normalizeFragment(source.split(/\r?\n/u).slice(start - 1, end).join("\n"))
}

export async function duplicateFingerprint(reportClone, sourceRoot) {
  const fragments = await Promise.all([
    readCloneFragment(reportClone, "first", sourceRoot),
    readCloneFragment(reportClone, "second", sourceRoot),
  ])
  fragments.sort()
  return createHash("sha256").update(fragments.join("\0")).digest("hex")
}

export function findNewDuplicates(baseClones, currentClones) {
  const remaining = new Map()
  for (const clone of baseClones) {
    remaining.set(clone.fingerprint, (remaining.get(clone.fingerprint) ?? 0) + 1)
  }

  return currentClones.filter((clone) => {
    const count = remaining.get(clone.fingerprint) ?? 0
    if (count === 0) return true
    remaining.set(clone.fingerprint, count - 1)
    return false
  })
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: "utf8",
    stdio: options.stdio ?? "pipe",
  })
  if (result.error) throw result.error
  if (result.status !== 0) {
    const details = [result.stdout, result.stderr].filter(Boolean).join("\n").trim()
    throw new Error(`${command} завершился с кодом ${result.status}${details ? `:\n${details}` : ""}`)
  }
  return result.stdout.trim()
}

function optionValue(args, option) {
  const index = args.indexOf(option)
  if (index !== -1) return args[index + 1]
  const prefix = `${option}=`
  return args.find((argument) => argument.startsWith(prefix))?.slice(prefix.length)
}

function resolveBaseRef(args, repoRoot) {
  const explicit = optionValue(args, "--base") ?? process.env.JSCPD_BASE_REF
  if (explicit) return explicit

  const target = process.env.JSCPD_TARGET_REF ?? "develop"
  return run("git", ["merge-base", "HEAD", target], { cwd: repoRoot })
}

function runJscpd({ jscpdBin, sourceRoot, configPath, reportDir }) {
  const paths = SOURCE_PATHS.filter((path) => existsSync(join(sourceRoot, path)))
  if (paths.length === 0) throw new Error(`В ${sourceRoot} нет каталогов для проверки`)

  mkdirSync(reportDir, { recursive: true })
  run(
    jscpdBin,
    [
      ...paths,
      "--config",
      configPath,
      "--reporters",
      "json",
      "--output",
      reportDir,
      "--exit-code",
      "0",
      "--absolute",
      "--silent",
      "--no-tips",
    ],
    { cwd: sourceRoot }
  )
}

async function readClones(reportDir, sourceRoot) {
  const reportPath = join(reportDir, "jscpd-report.json")
  const report = JSON.parse(await readFile(reportPath, "utf8"))
  return Promise.all(
    report.duplicates.map(async (clone) => ({
      ...clone,
      fingerprint: await duplicateFingerprint(clone, sourceRoot),
    }))
  )
}

function formatFile(file) {
  const { start, end } = fileRange(file)
  return `${file.name}:${start}-${end}`
}

export async function main(args = process.argv.slice(2)) {
  const repoRoot = run("git", ["rev-parse", "--show-toplevel"], { cwd: process.cwd() })
  const baseRef = resolveBaseRef(args, repoRoot)
  const tempDir = await mkdtemp(join(tmpdir(), "nkdk-jscpd-"))
  const baseArchive = join(tempDir, "base.tar")
  const baseRoot = join(tempDir, "base")
  const baseReportDir = join(tempDir, "base-report")
  const currentReportDir = join(tempDir, "current-report")
  const configPath = join(repoRoot, ".jscpd.json")
  const jscpdBin = join(repoRoot, "node_modules", ".bin", "jscpd")

  try {
    await mkdir(baseRoot, { recursive: true })
    run("git", ["archive", "--format=tar", "--output", baseArchive, baseRef], {
      cwd: repoRoot,
    })
    run("tar", ["-xf", baseArchive, "-C", baseRoot])

    runJscpd({ jscpdBin, sourceRoot: baseRoot, configPath, reportDir: baseReportDir })
    runJscpd({ jscpdBin, sourceRoot: repoRoot, configPath, reportDir: currentReportDir })

    const [baseClones, currentClones] = await Promise.all([
      readClones(baseReportDir, baseRoot),
      readClones(currentReportDir, repoRoot),
    ])
    const newClones = findNewDuplicates(baseClones, currentClones)

    if (newClones.length === 0) {
      console.log(`Новых дублей относительно ${baseRef} нет`)
      return
    }

    console.error(`Новые дубли относительно ${baseRef}: ${newClones.length}`)
    for (const clone of newClones) {
      console.error(`- ${formatFile(clone.firstFile)} ↔ ${formatFile(clone.secondFile)}`)
    }
    process.exitCode = 1
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
