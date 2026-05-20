import fs from "fs"
import os from "os"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { XmlSyncManifest } from "~/metadata/appliedObjects/configuration/migrations/xmlManifest"
import { MetadataCommonTemplateRules } from "~/metadata/appliedObjects/metadataCommonTemplate/rules"
import { syncModuleFromXML } from "./fromXML"
import { syncModuleToXML } from "./toXML"

describe("syncModule external files", () => {
  it("round-trips CommonTemplate Template.bin through rule externalFiles", async () => {
    const tmpDir = fs.mkdtempSync(join(os.tmpdir(), "module-external-"))
    const xmlDir = join(tmpDir, "xml", "CommonTemplates")
    const nkdkDir = join(tmpDir, "yaml", "Шаблон")
    const outputDir = join(tmpDir, "out", "CommonTemplates")
    const name = "Шаблон"
    const templateBin = Buffer.from([0, 1, 2, 255])

    await fs.promises.mkdir(join(xmlDir, name, "Ext"), { recursive: true })
    await fs.promises.writeFile(join(xmlDir, name, "Ext", "Template.bin"), templateBin)

    await syncModuleFromXML({
      rule: MetadataCommonTemplateRules.properties.template,
      xmlDir,
      nkdkDir,
      name,
    })

    expect([...fs.readFileSync(join(nkdkDir, "Template.bin"))]).toEqual([...templateBin])

    const xmlManifest = new XmlSyncManifest(join(tmpDir, "out"))
    await syncModuleToXML({
      rule: MetadataCommonTemplateRules.properties.template,
      nkdkDir,
      xmlDir: outputDir,
      name,
      xmlManifest,
    })

    const outputPath = join(outputDir, name, "Ext", "Template.bin")
    expect([...fs.readFileSync(outputPath)]).toEqual([...templateBin])
    expect(xmlManifest.expectedFiles()).toContain("CommonTemplates/Шаблон/Ext/Template.bin")
  })
})
