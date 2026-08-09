import { existsSync } from "node:fs"
import { readFile, rename, rm, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import {
  assertCycleRewriteNotWorse,
  createCycleBaseline,
} from "./cycle-baseline.mjs"
import { createCruiseResult } from "./cruise-result.mjs"
import { cycleBaselinePath } from "./paths.mjs"

export async function updateCycleBaseline({
  path,
  currentResult,
  initial = false,
}) {
  const candidate = createCycleBaseline(currentResult)
  if (initial) {
    if (existsSync(path)) {
      throw new Error("Первоначальный cycle-baseline уже существует")
    }
  } else {
    const known = JSON.parse(await readFile(path, "utf8"))
    assertCycleRewriteNotWorse(currentResult, known)
  }

  const temporaryPath = `${path}.tmp`
  await rm(temporaryPath, { force: true })
  try {
    await writeFile(temporaryPath, `${JSON.stringify(candidate, null, 2)}\n`)
    await rename(temporaryPath, path)
  } finally {
    await rm(temporaryPath, { force: true })
  }
}

async function main() {
  const args = process.argv.slice(2).filter((argument) => argument !== "--")
  const mode = args[0]
  if (
    args.length !== 1 ||
    !["--write-initial", "--accept-rewrite"].includes(mode)
  ) {
    throw new Error(
      "Укажите --write-initial для первого снимка или --accept-rewrite для подтверждённой перезаписи"
    )
  }

  const currentResult = createCruiseResult({
    ignoreKnown: false,
    writeEnhanced: false,
  })
  await updateCycleBaseline({
    path: cycleBaselinePath,
    currentResult,
    initial: mode === "--write-initial",
  })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main()
}
