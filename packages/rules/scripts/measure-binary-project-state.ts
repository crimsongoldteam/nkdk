#!/usr/bin/env node
import fs from "node:fs"
import { mkdtemp } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import Piscina from "piscina"
import { loadBinaryProjectState, projectStateBinaryPath, saveBinaryProjectState } from "../metadata/projectState/binary/persistence"
import { createBinaryProjectStateReadToken } from "../metadata/projectState/binary/readToken"
import { ProjectStateSnapshotView } from "../metadata/projectState/binary/snapshot"
import { sourceWorkerExecArgv } from "../metadata/sourceWorkerRuntime"
import type {
  BinaryProjectStateLookupResult,
  BinaryProjectStateLookupTask,
} from "./measure-binary-project-state-worker"

export interface MeasureBinaryProjectStateOptions {
  readonly projectDir: string
  readonly lookups: number
  readonly workers: number
}

export function parseMeasureBinaryProjectStateArgs(argv: readonly string[]): MeasureBinaryProjectStateOptions {
  let projectDir: string | undefined
  let lookups = 1_000_000
  let workers = 1

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]!
    if (argument === "--") continue
    if (argument === "--lookups" || argument === "--workers") {
      const value = argv[++index]
      if (value === undefined || !/^[1-9][0-9]*$/.test(value)) {
        throw new Error(`${argument} должен быть положительным целым числом`)
      }
      if (argument === "--lookups") lookups = Number(value)
      else workers = Number(value)
      continue
    }
    if (argument.startsWith("-")) throw new Error(`Неизвестный параметр ${argument}`)
    if (projectDir !== undefined) throw new Error("Можно указать только один каталог проекта")
    projectDir = argument
  }
  if (projectDir === undefined) throw new Error("Не указан каталог проекта")
  return { projectDir: resolve(projectDir), lookups, workers }
}

export async function measureBinaryProjectState(options: MeasureBinaryProjectStateOptions) {
  const readStartedAt = performance.now()
  const buffers = await loadBinaryProjectState(options.projectDir)
  const readSeconds = secondsSince(readStartedAt)
  if (buffers === undefined) {
    throw new Error(`Двоичное состояние не найдено: ${projectStateBinaryPath(options.projectDir)}`)
  }
  const snapshot = new ProjectStateSnapshotView(buffers)
  if (snapshot.targetRangeCount === 0) throw new Error("Двоичное состояние не содержит целей для поиска")

  const temporary = await mkdtemp(join(tmpdir(), "nkdk-project-state-measure-"))
  const workerFile = join(dirname(fileURLToPath(import.meta.url)), "measure-binary-project-state-worker.ts")
  const pool = new Piscina<BinaryProjectStateLookupTask, BinaryProjectStateLookupResult>({
    filename: workerFile,
    minThreads: options.workers,
    maxThreads: options.workers,
    execArgv: sourceWorkerExecArgv(),
  })

  try {
    const writeStartedAt = performance.now()
    await saveBinaryProjectState(temporary, buffers)
    const writeSeconds = secondsSince(writeStartedAt)

    const lookupStartedAt = performance.now()
    const results = await Promise.all(Array.from({ length: options.workers }, (_, workerIndex) => {
      const start = Math.floor(options.lookups * workerIndex / options.workers)
      const end = Math.floor(options.lookups * (workerIndex + 1) / options.workers)
      return pool.run({
        readToken: createBinaryProjectStateReadToken(buffers),
        start,
        count: end - start,
        totalLookups: options.lookups,
      })
    }))
    const lookupSeconds = secondsSince(lookupStartedAt)
    const fileBytes = (await fs.promises.stat(projectStateBinaryPath(options.projectDir))).size

    return {
      projectDir: resolve(options.projectDir),
      lookups: options.lookups,
      workers: options.workers,
      fileBytes,
      seconds: { read: readSeconds, write: writeSeconds, lookup: lookupSeconds },
      results: {
        found: results.reduce((sum, result) => sum + result.found, 0),
        missing: results.reduce((sum, result) => sum + result.missing, 0),
      },
      rssMiB: Math.round(Math.max(process.memoryUsage().rss, ...results.map(({ rssBytes }) => rssBytes)) / 1024 / 1024),
      hashIndexes: snapshot.hashIndexStats(),
    }
  } finally {
    await pool.destroy()
    await fs.promises.rm(temporary, { recursive: true, force: true })
  }
}

function secondsSince(startedAt: number): number {
  return Math.round((performance.now() - startedAt) * 1_000) / 1_000_000
}

function isMainModule(): boolean {
  const entry = process.argv[1]
  return entry !== undefined && resolve(entry) === fileURLToPath(import.meta.url)
}

if (isMainModule()) {
  try {
    console.log(JSON.stringify(await measureBinaryProjectState(parseMeasureBinaryProjectStateArgs(process.argv.slice(2))), null, 2))
  } catch (caught) {
    console.error(caught instanceof Error ? caught.message : String(caught))
    process.exitCode = 1
  }
}
