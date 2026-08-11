import { describe, expect, it } from "vitest"
import { commandSnapshotPath, measureConfigurationSnapshot } from "../../scripts/measure-configuration-snapshot.mjs"
import { decodeConfigurationIndex } from "@nkdk/runtime"
import { encodeConfigurationIndex } from "@nkdk/runtime"
import { sampleSnapshot } from "@nkdk/runtime"

describe("measure-configuration-snapshot", () => {
  it("отделяет логические payload от полной физической раскладки", () => {
    const encoded = encodeConfigurationIndex(sampleSnapshot())
    const measurement = measureConfigurationSnapshot(encoded, decodeConfigurationIndex(encoded)) as Measurement
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
        measurement.strings.byOwner.container +
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

  it("относит единственный componentPath к container, а shared оставляет только общим владельцам", () => {
    const snapshot = sampleSnapshot()
    const encoded = encodeConfigurationIndex({
      ...snapshot,
      componentPath: "container-only",
      files: [{ projectPath: "shared", contentHash: 1n }],
      entities: [
        {
          logicalAddress: "entity-only",
          sourceProjectPath: "shared",
          identities: { xmlName: "identity-only" },
        },
      ],
    })
    const measurement = measureConfigurationSnapshot(encoded, decodeConfigurationIndex(encoded)) as Measurement
    expect(measurement.strings.byOwner.container).toBe(Buffer.byteLength("container-only"))
    expect(measurement.strings.sharedBytes).toBe(Buffer.byteLength("shared"))
  })

  it.each([
    ["без пути", [], "Использование:"],
    ["с относительным путём", ["configuration-index.bin"], "должен быть абсолютным"],
    ["с двумя путями", ["/tmp/one.bin", "/tmp/two.bin"], "Использование:"],
  ])("отклоняет аргументы %s", (_case, args, message) => {
    expect(() => commandSnapshotPath(args)).toThrow(message)
  })
})

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
      container: number
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
