import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { discoverXmlImport } from "../../importFromXml/discovery"
import { transferXmlImportExternalFiles } from "../../importFromXml/transfer"
import { discoverFullXmlSyncPlan } from "../../fullSyncToXml/discovery"
import { transferFullXmlSyncExternalFiles } from "../../fullSyncToXml/transferExternalFiles"
import { compileRegisteredMetadataResourceTopology } from "../../resourceTopology/adapters/registeredRules"
import { buildConfigurationChildObjectsFromProjectEntries } from "../configuration/childObjects"
import { configurationChildObjectsFromIndex } from "../configuration/configurationChildObjects"
import { createConfigurationIndexCollector, createConfigurationIndexExportRuntime } from "@nkdk/runtime"
import { testConfigurationIndexReader } from "../../../tests/configurationIndex"

describe("Interface resources", () => {
  const directories: string[] = []
  afterEach(() => { for (const dir of directories.splice(0)) rmSync(dir, { recursive: true, force: true }) })

  it.each([Buffer.alloc(0), Buffer.from([0, 255, 13, 10, 128, 65])])("переносит непрозрачный Interface.bin (%s) в обоих направлениях", async bytes => {
    const root = mkdtempSync(join(tmpdir(), "nkdk-interface-"))
    directories.push(root)
    const xmlDir = join(root, "xml")
    const projectDir = join(root, "project")
    const interfaceDir = join(xmlDir, "Interfaces", "Полный", "Ext")
    mkdirSync(interfaceDir, { recursive: true })
    mkdirSync(projectDir)
    writeFileSync(join(xmlDir, "Interfaces", "Полный.xml"), readFileSync(new URL("./__fixtures__/Полный.xml", import.meta.url)))
    writeFileSync(join(interfaceDir, "Interface.bin"), bytes)
    const discovery = await discoverXmlImport({ xmlDir, topology: compileRegisteredMetadataResourceTopology() })
    expect(discovery.assignments).toHaveLength(1)
    const assignment = discovery.assignments.find(item => item.itemName === "Полный")!
    expect(assignment.targetProjectPath).toBe("Интерфейс/Полный/Свойства.yaml")
    expect(assignment.externalFiles).toEqual([{
      sourcePath: join(interfaceDir, "Interface.bin"), targetProjectPath: "Интерфейс/Полный/Interface.bin",
    }])
    await transferXmlImportExternalFiles({ projectDir, transfer: "copy", files: assignment.externalFiles.map(file => ({ ...file, sourceKind: "xml" })) })
    writeFileSync(join(projectDir, assignment.targetProjectPath), "")
    expect(readFileSync(join(projectDir, "Интерфейс/Полный/Interface.bin"))).toEqual(bytes)
    const plan = await discoverFullXmlSyncPlan(projectDir)
    expect(plan.externalFiles).toHaveLength(1)
    expect(plan.externalFiles[0]!.targetXmlPath).toBe("Interfaces/Полный/Ext/Interface.bin")
    const outputDir = join(root, "out")
    await transferFullXmlSyncExternalFiles({ outputDir, files: plan.externalFiles })
    expect(readFileSync(join(outputDir, "Interfaces/Полный/Ext/Interface.bin"))).toEqual(bytes)
  })

  it("сохраняет интерфейсы и их исходный порядок в ChildObjects по снимку", () => {
    const current = buildConfigurationChildObjectsFromProjectEntries({
      entries: [{ dir: "Интерфейс", name: "Общий" }, { dir: "Интерфейс", name: "Полный" }],
    })
    const index = createConfigurationIndexExportRuntime({
      source: testConfigurationIndexReader([{
        logicalAddress: "Конфигурация.Свойство.childObjects",
        children: [{ xmlName: "Interface", name: "Полный" }, { xmlName: "Interface", name: "Общий" }],
      }]),
      collector: createConfigurationIndexCollector(),
      targetProjectPath: "Конфигурация.yaml",
      logicalAddress: "Конфигурация",
    })
    const result = configurationChildObjectsFromIndex(index, current)
    expect(result).toEqual({ Interface: ["Полный", "Общий"] })
  })
})
