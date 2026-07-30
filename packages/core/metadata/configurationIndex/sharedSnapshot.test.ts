import fs from "fs"
import { tmpdir } from "os"
import { dirname, join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { ConfigurationIndexCompatibilityError } from "./decode"
import { encodeConfigurationIndex } from "./encode"
import { configurationIndexPath } from "./fileIO"
import {
  createConfigurationIndexReader,
  readConfigurationIndexSnapshot,
  snapshotConfigurationIndex,
} from "./sharedSnapshot"
import { reverseInputOrder, sampleSnapshot, TEST_UUID } from "./testData"

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

  it("exposes complete entities through sorted streaming readers", () => {
    const data = sampleSnapshot()
    const encoded = encodeConfigurationIndex(reverseInputOrder(data))

    const snapshot = snapshotConfigurationIndex(encoded)
    const first = createConfigurationIndexReader(snapshot)
    const second = createConfigurationIndexReader(snapshot)

    expect(first.header()).toEqual({
      specificationVersion: "1.3",
      indexGeneration: 7n,
      componentPath: "cf",
    })
    expect(second.snapshot.bytes).toBe(snapshot.bytes)
    expect(snapshot.byteLength).toBe(encoded.byteLength)
    expect(first.file("Документы/Заказ.yaml")).toEqual({
      projectPath: "Документы/Заказ.yaml",
      contentHash: 2n,
    })
    expect(first.file("Нет.yaml")).toBeUndefined()
    expect([...first.files()]).toEqual([
      { projectPath: "Configuration.yaml", contentHash: 1n },
      { projectPath: "Документы/Заказ.yaml", contentHash: 2n },
    ])
    expect(first.entity("Документ.Заказ")?.identities?.uuid).toBe(TEST_UUID)
    expect(first.entity("Документ.Заказ")).toEqual(data.entities[1])
    expect(first.entity("Нет")).toBeUndefined()
    expect([...first.entities()]).toEqual([data.entities[1], data.entities[0]])
    expect([...first.entitiesBySourceProjectPath("Документы/Заказ.yaml")]).toEqual([first.entity("Документ.Заказ")])
    expect([...first.entitiesBySourceProjectPath("Нет.yaml")]).toEqual([])
    expect(first).not.toHaveProperty("identities")
    expect(first).not.toHaveProperty("xmlNodes")
    expect(first).not.toHaveProperty("xmlValue")
  })

  it("rejects incompatible or corrupted index before creating a shared buffer", () => {
    const encoded = encodeConfigurationIndex(sampleSnapshot())
    const corrupted = Buffer.from(encoded)
    corrupted[0] = 0

    expect(() => snapshotConfigurationIndex(corrupted)).toThrow("Некорректный файл индекса конфигурации")
    expect(() => snapshotConfigurationIndex(encoded, { expectedComponentPath: "cfe/Расширение" })).toThrowError(
      ConfigurationIndexCompatibilityError
    )
  })

  it("reads the configuration component index into shared memory", async () => {
    const projectDir = await createProjectDir()
    const data = sampleSnapshot()
    const indexPath = configurationIndexPath(projectDir, { kind: "configuration" })
    await fs.promises.mkdir(dirname(indexPath), { recursive: true })
    await fs.promises.writeFile(indexPath, encodeConfigurationIndex(data))

    const snapshot = await readConfigurationIndexSnapshot({ projectDir, address: { kind: "configuration" } })
    expect(createConfigurationIndexReader(snapshot).header()).toEqual({
      specificationVersion: "1.3",
      indexGeneration: 7n,
      componentPath: "cf",
    })
    expect(Buffer.from(new Uint8Array(snapshot.bytes, 0, snapshot.byteLength))).toEqual(
      await fs.promises.readFile(indexPath)
    )
  })
})
