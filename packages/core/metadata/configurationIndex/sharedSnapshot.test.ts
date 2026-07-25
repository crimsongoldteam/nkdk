import fs from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { ConfigurationIndexCompatibilityError } from "./decode"
import { encodeConfigurationIndex } from "./encode"
import { configurationIndexPath, writeConfigurationIndexAtomically } from "./fileIO"
import {
  createConfigurationIndexReader,
  readConfigurationIndexSnapshot,
  snapshotConfigurationIndex,
} from "./sharedSnapshot"
import { sampleIndex } from "./testData"

describe("shared configuration index snapshot", () => {
  const projectDirs: string[] = []

  afterEach(async () => {
    await Promise.all(projectDirs.splice(0).map((projectDir) => fs.promises.rm(projectDir, { recursive: true })))
  })

  async function createProjectDir(): Promise<string> {
    const projectDir = await fs.promises.mkdtemp(join(tmpdir(), "nkdk-shared-index-"))
    projectDirs.push(projectDir)
    return projectDir
  }

  it("validates encoded bytes before exposing shared snapshot readers", () => {
    const data = sampleIndex()
    const encoded = encodeConfigurationIndex({
      ...data,
      projectFiles: [...data.projectFiles, { projectPath: "Catalogs/Товары/Свойства.yaml", contentHash: 42n }],
      identities: [
        ...data.identities,
        { logicalAddress: "Справочник.Товары", kind: "xmlId", value: "Catalog_Товары" },
      ],
      xmlValues: [
        ...data.xmlValues,
        {
          logicalAddress: "Справочник.Товары.form",
          extended: true,
          xsiNil: true,
          xsiType: "v8:UUID",
          xmlText: "text",
          xmlPrefix: "v8",
          userSettingsId: "00000000-0000-4000-8000-000000000099",
        },
      ],
    })

    const snapshot = snapshotConfigurationIndex(encoded)
    const first = createConfigurationIndexReader(snapshot)
    const second = createConfigurationIndexReader(snapshot)

    expect(first.binding()).toEqual(data.binding)
    expect(second.binding()).toEqual(data.binding)
    expect(snapshot.bytes).toBe(second.snapshot.bytes)
    expect(snapshot.byteLength).toBe(encoded.byteLength)
    expect(first.projectFile("Catalogs/Товары/Свойства.yaml")).toEqual({
      projectPath: "Catalogs/Товары/Свойства.yaml",
      contentHash: 42n,
    })
    expect(first.projectFile("Нет.yaml")).toBeUndefined()
    expect(first.identity("Справочник.Товары", "uuid")).toBe("00000000-0000-4000-8000-000000000001")
    expect(first.identity("Справочник.Товары", "xmlId")).toBe("Catalog_Товары")
    expect(first.identity("Справочник.Товары", "xmlName")).toBeUndefined()
    expect(first.xmlNode("Справочник.Товары")).toEqual({
      logicalAddress: "Справочник.Товары",
      order: ["name", "synonym"],
      aliases: { synonym: "Synonym" },
      present: ["name"],
    })
    expect(first.xmlValue("Справочник.Товары.form")).toEqual({
      logicalAddress: "Справочник.Товары.form",
      extended: true,
      xsiNil: true,
      xsiType: "v8:UUID",
      xmlText: "text",
      xmlPrefix: "v8",
      userSettingsId: "00000000-0000-4000-8000-000000000099",
    })
    expect(first.xmlValue("Нет.value")).toBeUndefined()
  })

  it("rejects incompatible or corrupted index before creating a shared buffer", () => {
    const encoded = encodeConfigurationIndex(sampleIndex())
    const corrupted = Buffer.from(encoded)
    corrupted[0] = 0

    expect(() => snapshotConfigurationIndex(corrupted)).toThrow("Некорректный файл индекса конфигурации")
    expect(() => snapshotConfigurationIndex(encoded, { expectedProducerVersion: "other" })).toThrowError(
      ConfigurationIndexCompatibilityError
    )
  })

  it("reads the configuration component index into shared memory", async () => {
    const projectDir = await createProjectDir()
    const data = sampleIndex()
    await writeConfigurationIndexAtomically({ projectDir, address: { kind: "configuration" }, data })

    const snapshot = await readConfigurationIndexSnapshot({ projectDir, address: { kind: "configuration" } })
    expect(createConfigurationIndexReader(snapshot).binding()).toEqual(data.binding)
    expect(Buffer.from(new Uint8Array(snapshot.bytes, 0, snapshot.byteLength))).toEqual(
      await fs.promises.readFile(configurationIndexPath(projectDir, { kind: "configuration" }))
    )
  })
})
