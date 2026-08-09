import { readFile, rename, rm, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { serializeBaseline } from "./baseline-format.mjs"
import { assertNoNewViolations } from "./check-result.mjs"
import { createCruiseResult } from "./cruise-result.mjs"
import { softenKnownViolations } from "./known-violations.mjs"
import { baselinePath, reportsDir } from "./paths.mjs"

export async function updateBaseline({ check, generate, baselinePath }) {
  const temporaryPath = `${baselinePath}.tmp`
  await rm(temporaryPath, { force: true })
  await check()
  try {
    const serialized = await generate()
    if (JSON.parse(serialized).length === 0) {
      await rm(baselinePath, { force: true })
      return
    }
    await writeFile(temporaryPath, serialized)
    await rename(temporaryPath, baselinePath)
  } finally {
    await rm(temporaryPath, { force: true })
  }
}

async function main() {
  const baselineCruisePath = resolve(reportsDir, "baseline.json")
  let candidate

  await updateBaseline({
    baselinePath,
    check: async () => {
      candidate = createCruiseResult({
        ignoreKnown: false,
        outputPath: baselineCruisePath,
        writeEnhanced: false,
      })
      const known = JSON.parse(await readFile(baselinePath, "utf8"))
      assertNoNewViolations(softenKnownViolations(candidate, known))
    },
    generate: async () => serializeBaseline(candidate),
  })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main()
}
