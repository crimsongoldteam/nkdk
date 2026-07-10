import fs from "fs"
import { mkdtempSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { MetadataDataProcessorRules } from "../../appliedObjects/metadataDataProcessor/rules"
import { mockContextToXML } from "../../../tests/mockContext"
import { syncAppliedObjectAreaToXML } from "./syncToXML"

describe("syncAppliedObjectAreaToXML", () => {
  const dirs: string[] = []

  afterEach(() => {
    for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
  })

  function tempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-partial-xml-"))
    dirs.push(dir)
    return dir
  }

  it("writes only owner area when requested", async () => {
    const inputDir = "metadata/appliedObjects/metadataDataProcessor/__fixtures__/sync/yaml"
    const referenceDir = "metadata/appliedObjects/metadataDataProcessor/__fixtures__/sync/xml"
    const outputDir = tempDir()

    await syncAppliedObjectAreaToXML({
      area: { kind: "owner" },
      rule: MetadataDataProcessorRules,
      context: mockContextToXML(),
      inputDir,
      name: "ОбработкаВсеСвойства",
      outputDir,
      externalOutputDir: join(outputDir, "ОбработкаВсеСвойства"),
      referenceDir,
      externalReferenceDir: join(referenceDir, "ОбработкаВсеСвойства"),
    })

    expect(fs.existsSync(join(outputDir, "ОбработкаВсеСвойства.xml"))).toBe(true)
    expect(fs.existsSync(join(outputDir, "ОбработкаВсеСвойства", "Ext", "ObjectModule.bsl"))).toBe(false)
  })

  it("writes only matching external file area when requested", async () => {
    const inputDir = "metadata/appliedObjects/metadataDataProcessor/__fixtures__/sync/yaml"
    const referenceDir = "metadata/appliedObjects/metadataDataProcessor/__fixtures__/sync/xml"
    const xmlRoot = tempDir()
    const outputDir = join(xmlRoot, "DataProcessors")

    await syncAppliedObjectAreaToXML({
      area: { kind: "externalFile", xmlPath: "DataProcessors/ОбработкаВсеСвойства/Ext/ObjectModule.bsl" },
      rule: MetadataDataProcessorRules,
      context: mockContextToXML(),
      inputDir,
      name: "ОбработкаВсеСвойства",
      outputDir,
      externalOutputDir: join(outputDir, "ОбработкаВсеСвойства"),
      referenceDir: join(referenceDir),
      externalReferenceDir: join(referenceDir, "ОбработкаВсеСвойства"),
    })

    expect(fs.existsSync(join(outputDir, "ОбработкаВсеСвойства.xml"))).toBe(false)
    expect(fs.existsSync(join(outputDir, "ОбработкаВсеСвойства", "Ext", "ObjectModule.bsl"))).toBe(true)
    expect(fs.existsSync(join(outputDir, "ОбработкаВсеСвойства", "Ext", "ManagerModule.bsl"))).toBe(false)
  })
})
