import { spawnSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { runTestDurationAssertion } from "./assert-test-durations.mjs"
import { resolveNodePackageBinary } from "../../../scripts/node-package-binary.mjs"

const lifecycleReporterPath = fileURLToPath(new URL("./test-file-lifecycle-reporter.mjs", import.meta.url))

export function parseVitestArguments(argv) {
  return argv[0] === "--" ? argv.slice(1) : argv
}

export function runTestDurationCheck(projectRoot, vitestArguments, spawn = spawnSync) {
  const reportDirectory = fs.mkdtempSync(join(os.tmpdir(), "nkdk-test-duration-"))
  const reportPath = join(reportDirectory, "test-cases.json")
  const lifecycleReportPath = join(reportDirectory, "test-files.json")

  try {
    const result = spawn(process.execPath, [
      resolveNodePackageBinary("vitest", import.meta.url),
      "run",
      ...vitestArguments,
      "--reporter=default",
      "--reporter=json",
      `--reporter=${lifecycleReporterPath}`,
      `--outputFile.json=${reportPath}`,
    ], {
      cwd: projectRoot,
      env: {
        ...process.env,
        NKDK_TEST_FILE_LIFECYCLE_REPORT: lifecycleReportPath,
      },
      stdio: "inherit",
    })
    const status = result.status ?? 1
    if (status !== 0) return status

    return runTestDurationAssertion({
      report: reportPath,
      lifecycleReport: lifecycleReportPath,
    })
  } finally {
    fs.rmSync(reportDirectory, { recursive: true, force: true })
  }
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    process.exitCode = runTestDurationCheck(process.cwd(), parseVitestArguments(process.argv.slice(2)))
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
