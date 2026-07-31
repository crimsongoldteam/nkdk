import { spawnSync } from "node:child_process"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { isDeepStrictEqual } from "node:util"
import { tsImport } from "tsx/esm/api"
import {
  collectXmlCorpus,
  comparableXml,
  firstDifferencePath,
  parseXmlParserArguments,
} from "./xml-parser-corpus.mjs"

export function aggregateParserRuns(records) {
  const runs = records.map(({ elapsedMs, peakRssMiB }) => ({ elapsedMs, peakRssMiB }))
  return {
    runs,
    medianElapsedMs: median(runs.map(({ elapsedMs }) => elapsedMs)),
    medianPeakRssMiB: median(runs.map(({ peakRssMiB }) => peakRssMiB)),
  }
}

export function runParserMeasurements(params, spawn = spawnSync) {
  const records = { current: [], saxes: [] }
  for (let run = 0; run < params.runs; run += 1) {
    const order = run % 2 === 0 ? ["current", "saxes"] : ["saxes", "current"]
    for (const parserName of order) {
      const result = spawn(
        process.execPath,
        [
          "--expose-gc",
          params.workerPath,
          "--parser",
          parserName,
          "--manifest",
          params.manifestPath,
        ],
        { encoding: "utf8" }
      )
      if (result.status !== 0) {
        throw new Error(String(result.stderr || `XML parser worker завершился с кодом ${result.status}`))
      }
      records[parserName].push(JSON.parse(String(result.stdout).trim()))
    }
  }
  return {
    current: aggregateParserRuns(records.current),
    saxes: aggregateParserRuns(records.saxes),
  }
}

export async function measureXmlParsers(coreDir, options) {
  const corpus = await collectXmlCorpus(coreDir, options)
  const currentModule = await tsImport("../xml/import/importer.ts", import.meta.url)
  const saxesModule = await tsImport("../xml/import/experimental/saxesImporter.ts", import.meta.url)

  for (const path of corpus.allPaths) {
    const xml = await readFile(path, "utf8")
    const current = comparableXml(currentModule.importContentFromXML(xml))
    const saxes = comparableXml(saxesModule.importContentFromXMLWithSaxes(xml))
    if (!isDeepStrictEqual(current, saxes)) {
      throw new Error(`XML parser mismatch: ${path} at ${firstDifferencePath(current, saxes) ?? "$"}`)
    }
  }

  const temporaryDirectory = await mkdtemp(join(tmpdir(), "nkdk-xml-parser-"))
  try {
    const manifestPath = join(temporaryDirectory, "manifest.json")
    await writeFile(manifestPath, JSON.stringify(corpus.allPaths))
    const measurements = runParserMeasurements({
      workerPath: fileURLToPath(new URL("./xml-parser-profile-worker.mjs", import.meta.url)),
      manifestPath,
      runs: options.runs,
    })
    const elapsedDeltaPercent = percentDelta(
      measurements.current.medianElapsedMs,
      measurements.saxes.medianElapsedMs
    )
    const peakRssDeltaPercent = percentDelta(
      measurements.current.medianPeakRssMiB,
      measurements.saxes.medianPeakRssMiB
    )
    return {
      corpus: {
        fixtureFiles: corpus.fixturePaths.length,
        smallFiles: corpus.smallPaths.length,
        largeFiles: corpus.largePaths.length,
        allFiles: corpus.allPaths.length,
      },
      equivalent: true,
      ...measurements,
      elapsedDeltaPercent,
      peakRssDeltaPercent,
    }
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true })
  }
}

function median(values) {
  if (values.length === 0) throw new Error("Нельзя вычислить медиану пустого набора")
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.floor(sorted.length / 2)]
}

function percentDelta(baseline, candidate) {
  return ((candidate - baseline) / baseline) * 100
}

const scriptPath = fileURLToPath(import.meta.url)
const coreDir = resolve(dirname(scriptPath), "..")
if (process.argv[1] !== undefined && scriptPath === resolve(process.argv[1])) {
  measureXmlParsers(coreDir, parseXmlParserArguments(process.argv.slice(2)))
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
      process.exitCode = 1
    })
}
