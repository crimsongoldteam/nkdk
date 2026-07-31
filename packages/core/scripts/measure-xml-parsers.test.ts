import { describe, expect, it } from "vitest"
// @ts-expect-error CLI-модуль остаётся JavaScript без декларации типов.
import * as measurement from "./measure-xml-parsers.mjs"

const { aggregateParserRuns, runParserMeasurements } = measurement

describe("XML parser measurements", () => {
  it("вычисляет медианы трёх прогонов", () => {
    expect(
      aggregateParserRuns([
        { elapsedMs: 30, peakRssMiB: 90 },
        { elapsedMs: 10, peakRssMiB: 70 },
        { elapsedMs: 20, peakRssMiB: 80 },
      ])
    ).toEqual({
      runs: [
        { elapsedMs: 30, peakRssMiB: 90 },
        { elapsedMs: 10, peakRssMiB: 70 },
        { elapsedMs: 20, peakRssMiB: 80 },
      ],
      medianElapsedMs: 20,
      medianPeakRssMiB: 80,
    })
  })

  it("чередует парсеры и создаёт новый процесс для каждого прогона", () => {
    const calls: Array<{ command: string; args: string[] }> = []
    const values = {
      current: [
        { elapsedMs: 10, peakRssMiB: 100 },
        { elapsedMs: 11, peakRssMiB: 101 },
        { elapsedMs: 12, peakRssMiB: 102 },
      ],
      saxes: [
        { elapsedMs: 7, peakRssMiB: 70 },
        { elapsedMs: 8, peakRssMiB: 71 },
        { elapsedMs: 9, peakRssMiB: 72 },
      ],
    }
    const spawn = (command: string, args: string[]) => {
      calls.push({ command, args })
      const parser = args[args.indexOf("--parser") + 1] as "current" | "saxes"
      const record = values[parser].shift()
      return { status: 0, stdout: JSON.stringify({ parser, ...record }), stderr: "" }
    }

    const result = runParserMeasurements(
      { workerPath: "/worker.mjs", manifestPath: "/manifest.json", runs: 3 },
      spawn
    )

    expect(calls.map(({ args }) => args[args.indexOf("--parser") + 1])).toEqual([
      "current",
      "saxes",
      "saxes",
      "current",
      "current",
      "saxes",
    ])
    expect(calls).toHaveLength(6)
    expect(calls.every(({ command, args }) => command === process.execPath && args[0] === "--expose-gc")).toBe(true)
    expect(result.current.medianElapsedMs).toBe(11)
    expect(result.saxes.medianPeakRssMiB).toBe(71)
  })

  it("останавливается при ошибке worker", () => {
    expect(() =>
      runParserMeasurements(
        { workerPath: "/worker.mjs", manifestPath: "/manifest.json", runs: 3 },
        () => ({ status: 1, stdout: "", stderr: "parse failed" })
      )
    ).toThrow("parse failed")
  })
})
