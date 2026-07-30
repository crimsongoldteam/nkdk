import { spawnSync } from "node:child_process"
import fs from "node:fs"
import { basename, dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { collectTestDurationProfile } from "./test-duration-profile.mjs"

const seeds = [20260730, 20260730, 20260731]
const outputPattern = /^reports\/test-profile\/[a-z0-9][a-z0-9._-]*\.json$/u

export function parseProfileArguments(argv) {
  const args = argv[0] === "--" ? argv.slice(1) : argv
  if (args.length !== 2 || args[0] !== "--output" || !outputPattern.test(args[1] ?? "")) {
    throw new Error(
      "Использование: pnpm test:profile -- --output reports/test-profile/<имя>.json"
    )
  }
  return {
    output: args[1],
    runs: 3,
    thresholdMs: 10,
  }
}

export function runTestDurationProfile(projectRoot, options, spawn = spawnSync) {
  const outputPath = resolve(projectRoot, options.output)
  const runDirectory = join(projectRoot, "reports/test-profile/.runs")
  const reportPaths = seeds.map(
    (_seed, index) => join(runDirectory, `${basename(options.output, ".json")}-${index + 1}.json`)
  )
  fs.mkdirSync(runDirectory, { recursive: true })

  for (let index = 0; index < seeds.length; index++) {
    const reportPath = reportPaths[index]
    fs.rmSync(reportPath, { force: true })
    const result = spawn(
      "pnpm",
      [
        "--filter",
        "@nkdk/core",
        "exec",
        "vitest",
        "run",
        "--no-isolate",
        "--sequence.shuffle",
        `--sequence.seed=${seeds[index]}`,
        "--reporter=json",
        `--outputFile.json=${reportPath}`,
      ],
      {
        cwd: projectRoot,
        stdio: "inherit",
      }
    )
    const status = result.status ?? 1
    if (status !== 0) return status
  }

  const reports = reportPaths.map((reportPath) =>
    JSON.parse(fs.readFileSync(reportPath, "utf8"))
  )
  const profile = {
    version: 1,
    runs: options.runs,
    thresholdMs: options.thresholdMs,
    seeds,
    tests: collectTestDurationProfile(reports, {
      projectRoot,
      thresholdMs: options.thresholdMs,
    }),
  }
  const temporaryPath = `${outputPath}.tmp`
  fs.mkdirSync(dirname(outputPath), { recursive: true })
  fs.writeFileSync(temporaryPath, `${JSON.stringify(profile, null, 2)}\n`)
  fs.renameSync(temporaryPath, outputPath)
  return 0
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    process.exitCode = runTestDurationProfile(
      process.cwd(),
      parseProfileArguments(process.argv.slice(2))
    )
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
