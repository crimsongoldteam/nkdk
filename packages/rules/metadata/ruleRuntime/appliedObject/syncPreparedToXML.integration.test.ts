import fs from "node:fs"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { MetadataDataProcessorRules } from "../../appliedObjects/metadataDataProcessor/rules"
import { mockContextToXML } from "../../../tests/mockContext"
import { prepareYamlFiles } from "../../project/prepareYamlFiles"
import { writePreparedAppliedObjectOwnerToXML } from "./syncToXML"

describe("writePreparedAppliedObjectOwnerToXML", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
  })

  function tempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-prepared-sync-"))
    tempDirs.push(dir)
    return dir
  }

  it("writes owner XML from prepared YAML data after source YAML is removed", async () => {
    const projectDir = tempDir()
    const sourceProjectPath = "Обработка/ОбработкаВсеСвойства/Свойства.yaml"
    const sourcePath = join(projectDir, ...sourceProjectPath.split("/"))
    fs.mkdirSync(join(projectDir, "Обработка", "ОбработкаВсеСвойства"), { recursive: true })
    fs.writeFileSync(sourcePath, "Синоним: Синоним\nКомментарий: Комментарий\n")
    const prepared = prepareYamlFiles({
      files: [
        {
          projectPath: sourceProjectPath,
          filePath: sourcePath,
          role: "properties",
          owner: { dir: "Обработка", name: "ОбработкаВсеСвойства" },
          itemType: "MetadataDataProcessor",
        },
      ],
      itemTypeByYamlDir: { Обработка: "MetadataDataProcessor" },
    })
    fs.rmSync(sourcePath)
    const outputPath = join(projectDir, "out", "DataProcessors", "ОбработкаВсеСвойства.xml")

    await writePreparedAppliedObjectOwnerToXML({
      rule: MetadataDataProcessorRules,
      context: mockContextToXML(),
      name: "ОбработкаВсеСвойства",
      outputPath,
      preparedYamlFile: prepared.yamlFiles[0]!,
    })

    const xml = fs.readFileSync(outputPath, "utf-8")
    expect(xml).toContain("<DataProcessor")
    expect(xml).toContain("<Name>ОбработкаВсеСвойства</Name>")
    expect(xml).toContain("<Comment>Комментарий</Comment>")
  })
})
