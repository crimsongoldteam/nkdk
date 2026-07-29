import fs from "node:fs"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { mockContextToXML } from "../../tests/mockContext"
import { readConfigurationIndex } from "../configurationIndex"
import { syncConfigurationToXml } from "./syncConfiguration"
import {
  createDirectFullSyncDependencies,
  createTempRoot,
  removeFullSyncTempDirs,
  writeSmallYamlProjectWithIndex,
} from "./testHelpers"

afterEach(async () => {
  await removeFullSyncTempDirs()
})

describe("full XML sync integration", () => {
  it("syncs a small YAML project through the configuration index without XML reference", async () => {
    const root = createTempRoot()
    const projectDir = join(root, "project")
    const yamlDir = join(projectDir, "cf")
    const outDir = join(root, "out")
    await writeSmallYamlProjectWithIndex(projectDir)

    const synced = await syncConfigurationToXml(
      {
        context: mockContextToXML(),
        componentPath: "cf",
        projectDir,
        xmlDir: outDir,
        concurrency: 1,
      },
      createDirectFullSyncDependencies()
    )

    expect(synced.failed).toEqual([])
    expect(fs.existsSync(join(outDir, "Configuration.xml"))).toBe(true)
    expect(fs.existsSync(join(outDir, "ConfigDumpInfo.xml"))).toBe(false)
    expect(fs.existsSync(join(outDir, "Bots", "БотВсеСвойства.xml"))).toBe(true)
    expect(fs.existsSync(join(outDir, "Bots", "БотВсеСвойства", "Ext", "Module.bsl"))).toBe(true)

    const botXml = fs.readFileSync(join(outDir, "Bots", "БотВсеСвойства.xml"), "utf8")
    const configXml = fs.readFileSync(join(outDir, "Configuration.xml"), "utf8")

    expect(botXml).toContain('uuid="1f777cc7-ac1c-46e8-8e35-82485cee6798"')
    expect(configXml).toContain("<Bot>БотВсеСвойства</Bot>")

    const sourceModule = fs.readFileSync(join(yamlDir, "Бот", "БотВсеСвойства", "Модуль.bsl"))
    const targetModule = fs.readFileSync(join(outDir, "Bots", "БотВсеСвойства", "Ext", "Module.bsl"))
    expect(targetModule).toEqual(sourceModule)

    const index = await readConfigurationIndex({ projectDir, address: { kind: "configuration" } })
    expect(index.indexGeneration).toBe(2n)
    expect(index.files.map((file) => file.projectPath)).toContain("Конфигурация.yaml")
    expect(index.files.map((file) => file.projectPath)).toContain("Бот/БотВсеСвойства/Модуль.bsl")
    expect(index.entities).toContainEqual(expect.objectContaining({
      logicalAddress: "Бот.БотВсеСвойства",
      identities: expect.objectContaining({
        uuid: "1f777cc7-ac1c-46e8-8e35-82485cee6798",
      }),
    }))
    expect(index.entities.some(({ logicalAddress }) =>
      logicalAddress.includes("ConfigDumpInfo")
    )).toBe(false)
    expect(index.entities).toContainEqual({
      logicalAddress: "ВнешнееСостояние",
      sourceProjectPath: "Бот/БотВсеСвойства/Модуль.bsl",
      xml: { explicitEmpty: true },
    })
  })

  it("reads and updates the index at the project root when YAML belongs to a component", async () => {
    const projectDir = createTempRoot()
    const outDir = join(projectDir, "out")
    await writeSmallYamlProjectWithIndex(projectDir)
    const yamlDir = join(projectDir, "cf")

    const synced = await syncConfigurationToXml(
      {
        context: mockContextToXML(),
        projectDir,
        componentPath: "cf",
        xmlDir: outDir,
        concurrency: 1,
      },
      createDirectFullSyncDependencies()
    )

    expect(synced.failed).toEqual([])
    expect(synced.configurationIndexPath).toContain(join(projectDir, ".nkdk"))
    expect(fs.existsSync(join(yamlDir, ".nkdk"))).toBe(false)
    expect((await readConfigurationIndex({ projectDir, address: { kind: "configuration" } })).files.length).toBeGreaterThan(0)
  })
})
