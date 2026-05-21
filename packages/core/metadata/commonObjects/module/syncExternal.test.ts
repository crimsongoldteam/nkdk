import fs from "fs"
import os from "os"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { XmlSyncManifest } from "~/metadata/appliedObjects/configuration/migrations/xmlManifest"
import { MetadataCommonTemplateRules } from "~/metadata/appliedObjects/metadataCommonTemplate/rules"
import { syncModuleFromXML } from "./fromXML"
import { syncModuleToXML } from "./toXML"

describe("syncModule external files", () => {
  it("round-trips CommonTemplate primary template file", async () => {
    const tmpDir = fs.mkdtempSync(join(os.tmpdir(), "module-external-"))
    const xmlDir = join(tmpDir, "xml", "CommonTemplates")
    const nkdkDir = join(tmpDir, "yaml", "Шаблон")
    const outputDir = join(tmpDir, "out", "CommonTemplates")
    const name = "Шаблон"
    const templateXml = "<Template/>"

    await fs.promises.mkdir(join(xmlDir, name, "Ext"), { recursive: true })
    await fs.promises.writeFile(join(xmlDir, name, "Ext", "Template.xml"), templateXml)

    await syncModuleFromXML({
      rule: MetadataCommonTemplateRules.properties.template,
      xmlDir,
      nkdkDir,
      name,
    })

    expect(fs.readFileSync(join(nkdkDir, "Template.xml"), "utf-8")).toBe(templateXml)

    const xmlManifest = new XmlSyncManifest(join(tmpDir, "out"))
    await syncModuleToXML({
      rule: MetadataCommonTemplateRules.properties.template,
      nkdkDir,
      xmlDir: join(outputDir, name),
      name,
      xmlManifest,
    })

    expect(fs.readFileSync(join(outputDir, name, "Ext", "Template.xml"), "utf-8")).toBe(templateXml)
    expect(xmlManifest.expectedFiles()).toContain("CommonTemplates/Шаблон/Ext/Template.xml")
  })

  it("round-trips CommonTemplate companion files", async () => {
    const tmpDir = fs.mkdtempSync(join(os.tmpdir(), "template-companions-"))
    const xmlDir = join(tmpDir, "xml", "CommonTemplates")
    const nkdkDir = join(tmpDir, "yaml", "Шаблон")
    const outputDir = join(tmpDir, "out", "CommonTemplates")
    const name = "Шаблон"
    const binContent = Buffer.from([0x01, 0x02, 0x03])
    const textContent = "plain text"
    const htmlContent = "<html/>"

    await fs.promises.mkdir(join(xmlDir, name, "Ext", "Template", "nested"), { recursive: true })
    await fs.promises.writeFile(join(xmlDir, name, "Ext", "Template.bin"), binContent)
    await fs.promises.writeFile(join(xmlDir, name, "Ext", "Template.txt"), textContent)
    await fs.promises.writeFile(join(xmlDir, name, "Ext", "Template", "index.html"), htmlContent)
    await fs.promises.writeFile(join(xmlDir, name, "Ext", "Template", "nested", "part.css"), "body{}")

    await syncModuleFromXML({
      rule: MetadataCommonTemplateRules.properties.template,
      xmlDir,
      nkdkDir,
      name,
    })

    expect([...fs.readFileSync(join(nkdkDir, "Template.bin"))]).toEqual([...binContent])
    expect(fs.readFileSync(join(nkdkDir, "Template.txt"), "utf-8")).toBe(textContent)
    expect(fs.readFileSync(join(nkdkDir, "Template", "index.html"), "utf-8")).toBe(htmlContent)
    expect(fs.readFileSync(join(nkdkDir, "Template", "nested", "part.css"), "utf-8")).toBe("body{}")

    const xmlManifest = new XmlSyncManifest(join(tmpDir, "out"))
    await syncModuleToXML({
      rule: MetadataCommonTemplateRules.properties.template,
      nkdkDir,
      xmlDir: join(outputDir, name),
      name,
      xmlManifest,
    })

    expect([...fs.readFileSync(join(outputDir, name, "Ext", "Template.bin"))]).toEqual([...binContent])
    expect(fs.readFileSync(join(outputDir, name, "Ext", "Template.txt"), "utf-8")).toBe(textContent)
    expect(fs.readFileSync(join(outputDir, name, "Ext", "Template", "index.html"), "utf-8")).toBe(htmlContent)
    expect(fs.readFileSync(join(outputDir, name, "Ext", "Template", "nested", "part.css"), "utf-8")).toBe("body{}")
    expect([...xmlManifest.expectedFiles()]).toEqual(
      expect.arrayContaining([
        "CommonTemplates/Шаблон/Ext/Template.bin",
        "CommonTemplates/Шаблон/Ext/Template.txt",
        "CommonTemplates/Шаблон/Ext/Template/index.html",
        "CommonTemplates/Шаблон/Ext/Template/nested/part.css",
      ])
    )
  })

  it("round-trips encrypted Module .bin as an alternative to .bsl", async () => {
    const tmpDir = fs.mkdtempSync(join(os.tmpdir(), "module-bin-"))
    const xmlDir = join(tmpDir, "xml", "DataProcessors")
    const nkdkDir = join(tmpDir, "yaml", "Обработка")
    const outputDir = join(tmpDir, "out", "DataProcessors")
    const name = "Обработка"
    const moduleBin = Buffer.from([0xff, 0xfe, 0x01, 0x02])
    const rule = {
      type: "Module" as const,
      nkdkPath: "МодульОбъекта.bsl",
      xmlPath: ({ name }: { name: string }) => `${name}/Ext/ObjectModule.bsl`,
    }

    await fs.promises.mkdir(join(xmlDir, name, "Ext"), { recursive: true })
    await fs.promises.writeFile(join(xmlDir, name, "Ext", "ObjectModule.bin"), moduleBin)

    await syncModuleFromXML({ rule, xmlDir, nkdkDir, name })

    expect([...fs.readFileSync(join(nkdkDir, "МодульОбъекта.bin"))]).toEqual([...moduleBin])
    expect(fs.existsSync(join(nkdkDir, "МодульОбъекта.bsl"))).toBe(false)

    const xmlManifest = new XmlSyncManifest(join(tmpDir, "out"))
    await syncModuleToXML({ rule, nkdkDir, xmlDir: outputDir, name, xmlManifest })

    expect([...fs.readFileSync(join(outputDir, name, "Ext", "ObjectModule.bin"))]).toEqual([...moduleBin])
    expect(xmlManifest.expectedFiles()).toContain("DataProcessors/Обработка/Ext/ObjectModule.bin")
  })

  it("fails when XML contains both .bsl and .bin for one Module", async () => {
    const tmpDir = fs.mkdtempSync(join(os.tmpdir(), "module-bin-conflict-"))
    const xmlDir = join(tmpDir, "xml", "DataProcessors")
    const nkdkDir = join(tmpDir, "yaml", "Обработка")
    const name = "Обработка"
    const rule = {
      type: "Module" as const,
      nkdkPath: "МодульОбъекта.bsl",
      xmlPath: ({ name }: { name: string }) => `${name}/Ext/ObjectModule.bsl`,
    }

    await fs.promises.mkdir(join(xmlDir, name, "Ext"), { recursive: true })
    await fs.promises.writeFile(join(xmlDir, name, "Ext", "ObjectModule.bsl"), "Процедура Тест()\nКонецПроцедуры\n")
    await fs.promises.writeFile(join(xmlDir, name, "Ext", "ObjectModule.bin"), Buffer.from([1, 2, 3]))

    await expect(syncModuleFromXML({ rule, xmlDir, nkdkDir, name })).rejects.toThrow("Module has both .bsl and .bin")
  })

  it("fails when YAML contains both .bsl and .bin for one Module", async () => {
    const tmpDir = fs.mkdtempSync(join(os.tmpdir(), "module-yaml-bin-conflict-"))
    const nkdkDir = join(tmpDir, "yaml", "Обработка")
    const outputDir = join(tmpDir, "out", "DataProcessors")
    const name = "Обработка"
    const rule = {
      type: "Module" as const,
      nkdkPath: "МодульОбъекта.bsl",
      xmlPath: ({ name }: { name: string }) => `${name}/Ext/ObjectModule.bsl`,
    }

    await fs.promises.mkdir(nkdkDir, { recursive: true })
    await fs.promises.writeFile(join(nkdkDir, "МодульОбъекта.bsl"), "Процедура Тест()\nКонецПроцедуры\n")
    await fs.promises.writeFile(join(nkdkDir, "МодульОбъекта.bin"), Buffer.from([1, 2, 3]))

    await expect(syncModuleToXML({ rule, nkdkDir, xmlDir: outputDir, name })).rejects.toThrow(
      "Module has both .bsl and .bin"
    )
  })
})
