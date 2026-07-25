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
    const yamlDir = join(root, "yaml")
    const outDir = join(root, "out")
    await writeSmallYamlProjectWithIndex(yamlDir)

    const synced = await syncConfigurationToXml(
      {
        context: mockContextToXML(),
        componentPath: "cf",
        yamlDir,
        xmlDir: outDir,
        concurrency: 1,
      },
      createDirectFullSyncDependencies()
    )

    expect(synced.failed).toEqual([])
    expect(fs.existsSync(join(outDir, "Configuration.xml"))).toBe(true)
    expect(fs.existsSync(join(outDir, "ConfigDumpInfo.xml"))).toBe(true)
    expect(fs.existsSync(join(outDir, "Bots", "БотВсеСвойства.xml"))).toBe(true)
    expect(fs.existsSync(join(outDir, "Bots", "БотВсеСвойства", "Ext", "Module.bsl"))).toBe(true)

    const botXml = fs.readFileSync(join(outDir, "Bots", "БотВсеСвойства.xml"), "utf8")
    const configXml = fs.readFileSync(join(outDir, "Configuration.xml"), "utf8")
    const configDumpInfoXml = fs.readFileSync(join(outDir, "ConfigDumpInfo.xml"), "utf8")

    expect(botXml).toContain('uuid="1f777cc7-ac1c-46e8-8e35-82485cee6798"')
    expect(configXml).toContain("<Bot>БотВсеСвойства</Bot>")
    expect(configDumpInfoXml).toContain('name="Bot.БотВсеСвойства"')

    const sourceModule = fs.readFileSync(join(yamlDir, "Бот", "БотВсеСвойства", "Модуль.bsl"))
    const targetModule = fs.readFileSync(join(outDir, "Bots", "БотВсеСвойства", "Ext", "Module.bsl"))
    expect(targetModule).toEqual(sourceModule)

    const index = await readConfigurationIndex({ projectDir: yamlDir, address: { kind: "configuration" } })
    expect(index.projectFiles.map((file) => file.projectPath)).toContain("Конфигурация.yaml")
    expect(index.projectFiles.map((file) => file.projectPath)).toContain("Бот/БотВсеСвойства/Модуль.bsl")
    expect(index.identities).toContainEqual({
      logicalAddress: "Бот.БотВсеСвойства",
      kind: "uuid",
      value: "1f777cc7-ac1c-46e8-8e35-82485cee6798",
    })
  })

  it("reads and updates the index at the project root when YAML belongs to a component", async () => {
    const projectDir = createTempRoot()
    const yamlDir = join(projectDir, "cf")
    const outDir = join(projectDir, "out")
    await writeSmallYamlProjectWithIndex(yamlDir)
    fs.renameSync(join(yamlDir, ".nkdk"), join(projectDir, ".nkdk"))

    const synced = await syncConfigurationToXml(
      {
        context: mockContextToXML(),
        projectDir,
        componentPath: "cf",
        yamlDir,
        xmlDir: outDir,
        concurrency: 1,
      },
      createDirectFullSyncDependencies()
    )

    expect(synced.failed).toEqual([])
    expect(synced.configurationIndexPath).toContain(join(projectDir, ".nkdk"))
    expect(fs.existsSync(join(yamlDir, ".nkdk"))).toBe(false)
    expect((await readConfigurationIndex({ projectDir, address: { kind: "configuration" } })).projectFiles.length).toBeGreaterThan(0)
  })
})
