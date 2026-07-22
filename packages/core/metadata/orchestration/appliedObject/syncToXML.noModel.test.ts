import fs from "node:fs"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"

import { MetadataDataProcessorRules } from "../../appliedObjects/metadataDataProcessor/rules"
import { mockContextToXML } from "../../../tests/mockContext"
import { syncAppliedObjectAreaToXML } from "./syncToXML"

describe("syncAppliedObjectAreaToXML без metadata-модели", () => {
  const dirs: string[] = []

  afterEach(() => {
    for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
  })

  it("формирует owner XML прямо из YAML", async () => {
    const outputDir = mkdtempSync(join(tmpdir(), "nkdk-direct-owner-"))
    dirs.push(outputDir)

    await syncAppliedObjectAreaToXML({
      area: { kind: "owner" },
      rule: MetadataDataProcessorRules,
      context: mockContextToXML(),
      inputDir: "metadata/appliedObjects/metadataDataProcessor/__fixtures__/sync/yaml",
      name: "ОбработкаВсеСвойства",
      outputDir,
      referenceDir: "metadata/appliedObjects/metadataDataProcessor/__fixtures__/sync/xml",
    })

    expect(fs.readFileSync(join(outputDir, "ОбработкаВсеСвойства.xml"), "utf8")).toContain("<DataProcessor")
  })

  it("записывает выбранный внешний файл прямо из YAML", async () => {
    const xmlRoot = mkdtempSync(join(tmpdir(), "nkdk-direct-external-"))
    dirs.push(xmlRoot)
    const outputDir = join(xmlRoot, "DataProcessors")

    await syncAppliedObjectAreaToXML({
      area: { kind: "externalFile", xmlPath: "DataProcessors/ОбработкаВсеСвойства/Ext/ObjectModule.bsl" },
      rule: MetadataDataProcessorRules,
      context: mockContextToXML(),
      inputDir: "metadata/appliedObjects/metadataDataProcessor/__fixtures__/sync/yaml",
      name: "ОбработкаВсеСвойства",
      outputDir,
      externalOutputDir: join(outputDir, "ОбработкаВсеСвойства"),
      referenceDir: "metadata/appliedObjects/metadataDataProcessor/__fixtures__/sync/xml",
      externalReferenceDir: "metadata/appliedObjects/metadataDataProcessor/__fixtures__/sync/xml/ОбработкаВсеСвойства",
    })

    expect(fs.existsSync(join(outputDir, "ОбработкаВсеСвойства.xml"))).toBe(false)
    expect(fs.existsSync(join(outputDir, "ОбработкаВсеСвойства", "Ext", "ObjectModule.bsl"))).toBe(true)
  })
})
