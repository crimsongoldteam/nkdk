import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import { afterEach, describe, expect, it } from "vitest"
import { encodeConfigurationIndex } from "./encode"
import { sampleSnapshot } from "./testData"

const scriptPath = join(import.meta.dirname, "../../scripts/measure-configuration-snapshot.mjs")
const tempDirs: string[] = []

afterEach(() => {
  for (const directory of tempDirs.splice(0)) fs.rmSync(directory, { recursive: true, force: true })
})

describe("measure-configuration-snapshot", () => {
  it("отделяет логические payload от полной физической раскладки", () => {
    const encoded = encodeConfigurationIndex(sampleSnapshot())
    const snapshotPath = temporarySnapshot(encoded)

    const result = spawnSync(process.execPath, [scriptPath, "--", snapshotPath], { encoding: "utf8" })

    expect(result.status).toBe(0)
    expect(result.stderr).toBe("")
    const measurement = JSON.parse(result.stdout) as Measurement
    expect(measurement.fileBytes).toBe(encoded.length)
    expect(measurement.files).toMatchObject({ records: 2, payloadBytes: expect.any(Number) })
    expect(measurement.entities).toMatchObject({
      records: 2,
      basePayloadBytes: expect.any(Number),
      identitiesPayloadBytes: expect.any(Number),
      omittedChildrenPayloadBytes: expect.any(Number),
      xmlPayloadBytes: expect.any(Number),
    })
    expect(measurement.files.payloadBytes).toBeGreaterThan(0)
    expect(
      Object.values(measurement.entities)
        .slice(1)
        .every((bytes) => bytes > 0)
    ).toBe(true)
    expect(measurement.strings.sharedBytes).toBeGreaterThan(0)
    expect(
      measurement.strings.sharedBytes +
        measurement.strings.byOwner.files +
        measurement.strings.byOwner.entityBase +
        measurement.strings.byOwner.identities +
        measurement.strings.byOwner.omittedChildren +
        measurement.strings.byOwner.xml
    ).toBe(measurement.strings.totalBytes)

    const sectionPayloadBytes = Object.values(measurement.physical.sectionPayloadBytes).reduce(
      (total, bytes) => total + bytes,
      0
    )
    const physicalSum =
      measurement.physical.headerBytes +
      measurement.physical.directoryBytes +
      measurement.physical.checksumBytes +
      sectionPayloadBytes +
      measurement.physical.paddingBytes
    expect(physicalSum).toBe(encoded.length)
    expect(measurement.physical.totalBytes).toBe(encoded.length)
  })

  it.each([
    ["без пути", []],
    ["с относительным путём", ["configuration-index.bin"]],
    ["с двумя путями", ["/tmp/one.bin", "/tmp/two.bin"]],
  ])("завершается с кодом 1 %s", (_case, args) => {
    const result = spawnSync(process.execPath, [scriptPath, ...args], { encoding: "utf8" })

    expect(result.status).toBe(1)
    expect(result.stdout).toBe("")
    expect(result.stderr).not.toBe("")
  })
})

function temporarySnapshot(bytes: Uint8Array): string {
  const directory = fs.mkdtempSync(join(os.tmpdir(), "nkdk-configuration-snapshot-measure-"))
  tempDirs.push(directory)
  const path = join(directory, "configuration-index.bin")
  fs.writeFileSync(path, bytes)
  return path
}

interface Measurement {
  fileBytes: number
  files: { records: number; payloadBytes: number }
  entities: {
    records: number
    basePayloadBytes: number
    identitiesPayloadBytes: number
    omittedChildrenPayloadBytes: number
    xmlPayloadBytes: number
  }
  strings: {
    totalBytes: number
    sharedBytes: number
    byOwner: {
      files: number
      entityBase: number
      identities: number
      omittedChildren: number
      xml: number
    }
  }
  physical: {
    headerBytes: number
    directoryBytes: number
    checksumBytes: number
    sectionPayloadBytes: {
      snapshot: number
      strings: number
      files: number
      entities: number
    }
    paddingBytes: number
    totalBytes: number
  }
}
