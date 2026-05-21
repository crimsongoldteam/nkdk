import fs from "fs"
import os from "os"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { XmlSyncManifest } from "~/metadata/appliedObjects/configuration/migrations/xmlManifest"
import { MetadataCommonTemplateRules } from "~/metadata/appliedObjects/metadataCommonTemplate/rules"
import { syncModuleFromXML } from "./fromXML"
import { syncModuleToXML } from "./toXML"

describe("syncModule external files", () => {
  it("round-trips CommonTemplate external files through rule externalFiles", async () => {
    const tmpDir = fs.mkdtempSync(join(os.tmpdir(), "module-external-"))
    const xmlDir = join(tmpDir, "xml", "CommonTemplates")
    const nkdkDir = join(tmpDir, "yaml", "Шаблон")
    const outputDir = join(tmpDir, "out", "CommonTemplates")
    const name = "Шаблон"
    const templateBin = Buffer.from([0, 1, 2, 255])
    const templateTxt = "plain text template"
    const templateHtml = "<html><body>Привет</body></html>"
    const templateImage = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

    await fs.promises.mkdir(join(xmlDir, name, "Ext", "Template", "_files"), { recursive: true })
    await fs.promises.writeFile(join(xmlDir, name, "Ext", "Template.bin"), templateBin)
    await fs.promises.writeFile(join(xmlDir, name, "Ext", "Template.txt"), templateTxt)
    await fs.promises.writeFile(join(xmlDir, name, "Ext", "Template", "ru.html"), templateHtml)
    await fs.promises.writeFile(join(xmlDir, name, "Ext", "Template", "_files", "1.png"), templateImage)

    await syncModuleFromXML({
      rule: MetadataCommonTemplateRules.properties.template,
      xmlDir,
      nkdkDir,
      name,
    })

    expect([...fs.readFileSync(join(nkdkDir, "Template.bin"))]).toEqual([...templateBin])
    expect(fs.readFileSync(join(nkdkDir, "Template.txt"), "utf-8")).toBe(templateTxt)
    expect(fs.readFileSync(join(nkdkDir, "Template", "ru.html"), "utf-8")).toBe(templateHtml)
    expect([...fs.readFileSync(join(nkdkDir, "Template", "_files", "1.png"))]).toEqual([...templateImage])

    const xmlManifest = new XmlSyncManifest(join(tmpDir, "out"))
    await syncModuleToXML({
      rule: MetadataCommonTemplateRules.properties.template,
      nkdkDir,
      xmlDir: outputDir,
      name,
      xmlManifest,
    })

    expect([...fs.readFileSync(join(outputDir, name, "Ext", "Template.bin"))]).toEqual([...templateBin])
    expect(fs.readFileSync(join(outputDir, name, "Ext", "Template.txt"), "utf-8")).toBe(templateTxt)
    expect(fs.readFileSync(join(outputDir, name, "Ext", "Template", "ru.html"), "utf-8")).toBe(templateHtml)
    expect([...fs.readFileSync(join(outputDir, name, "Ext", "Template", "_files", "1.png"))]).toEqual([
      ...templateImage,
    ])

    expect(xmlManifest.expectedFiles()).toEqual(
      expect.arrayContaining([
        "CommonTemplates/Шаблон/Ext/Template.bin",
        "CommonTemplates/Шаблон/Ext/Template.txt",
        "CommonTemplates/Шаблон/Ext/Template/ru.html",
        "CommonTemplates/Шаблон/Ext/Template/_files/1.png",
      ])
    )
  })
})
