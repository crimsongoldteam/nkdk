import fs from "fs"
import os from "os"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { syncChildTemplateNamesFromXML } from "./syncExternalFromXML"
import { syncChildTemplateNamesToXML } from "./syncExternalToXML"

const rule = { type: "ChildTemplateNames" as const, xml: "Template", folderName: "Шаблоны", forReferenceOnly: true as const }

const writeFile = (path: string, content: string | Buffer) => {
  fs.mkdirSync(join(path, ".."), { recursive: true })
  fs.writeFileSync(path, content)
}

describe("syncChildTemplateNames external files", () => {
  it("сохраняет Template.txt и вложенный Ext/Template.xml", async () => {
    const tempDir = fs.mkdtempSync(join(os.tmpdir(), "child-template-names-"))
    const xmlDir = join(tempDir, "xml")
    const nkdkDir = join(tempDir, "nkdk")
    const outputDir = join(tempDir, "out")

    writeFile(join(xmlDir, "Отчет", "Templates", "Макет.xml"), "<MetaDataObject/>")
    writeFile(join(xmlDir, "Отчет", "Templates", "Макет", "Ext", "Template.txt"), "text-template")
    writeFile(join(xmlDir, "Отчет", "Templates", "Бинарный.xml"), "<MetaDataObject/>")
    writeFile(join(xmlDir, "Отчет", "Templates", "Бинарный", "Ext", "Template.bin"), Buffer.from([0, 1, 2, 255]))
    writeFile(join(xmlDir, "Отчет", "Templates", "Схема.xml"), "<MetaDataObject/>")
    writeFile(join(xmlDir, "Отчет", "Templates", "Схема", "Ext", "Template.xml"), "<DataCompositionSchema/>")
    writeFile(join(xmlDir, "Отчет", "Templates", "HTML.xml"), "<MetaDataObject/>")
    writeFile(join(xmlDir, "Отчет", "Templates", "HTML", "Ext", "Template", "index.html"), "<html></html>")
    writeFile(join(xmlDir, "Отчет", "Templates", "HTML", "Ext", "Template", "_files", "logo.png"), Buffer.from([137, 80]))

    await syncChildTemplateNamesFromXML({
      context: mockContextFromXML(),
      rule,
      xmlDir,
      nkdkDir,
      name: "Отчет",
    })

    expect(fs.readFileSync(join(nkdkDir, "Шаблоны", "Макет", "Template.xml"), "utf-8")).toBe("<MetaDataObject/>")
    expect(fs.readFileSync(join(nkdkDir, "Шаблоны", "Макет", "Template.txt"), "utf-8")).toBe("text-template")
    expect([...fs.readFileSync(join(nkdkDir, "Шаблоны", "Бинарный", "Template.bin"))]).toEqual([0, 1, 2, 255])
    expect(fs.readFileSync(join(nkdkDir, "Шаблоны", "Схема", "Ext", "Template.xml"), "utf-8")).toBe(
      "<DataCompositionSchema/>"
    )
    expect(fs.readFileSync(join(nkdkDir, "Шаблоны", "HTML", "Template", "index.html"), "utf-8")).toBe("<html></html>")
    expect([...fs.readFileSync(join(nkdkDir, "Шаблоны", "HTML", "Template", "_files", "logo.png"))]).toEqual([
      137, 80,
    ])

    await syncChildTemplateNamesToXML({
      context: mockContextToXML(),
      rule,
      nkdkDir,
      xmlDir: outputDir,
      name: "Отчет",
    })

    expect(fs.readFileSync(join(outputDir, "Отчет", "Templates", "Макет.xml"), "utf-8")).toBe("<MetaDataObject/>")
    expect(fs.readFileSync(join(outputDir, "Отчет", "Templates", "Макет", "Ext", "Template.txt"), "utf-8")).toBe(
      "text-template"
    )
    expect([...fs.readFileSync(join(outputDir, "Отчет", "Templates", "Бинарный", "Ext", "Template.bin"))]).toEqual([
      0, 1, 2, 255,
    ])
    expect(fs.readFileSync(join(outputDir, "Отчет", "Templates", "Схема", "Ext", "Template.xml"), "utf-8")).toBe(
      "<DataCompositionSchema/>"
    )
    expect(fs.readFileSync(join(outputDir, "Отчет", "Templates", "HTML", "Ext", "Template", "index.html"), "utf-8")).toBe(
      "<html></html>"
    )
    expect([
      ...fs.readFileSync(join(outputDir, "Отчет", "Templates", "HTML", "Ext", "Template", "_files", "logo.png")),
    ]).toEqual([137, 80])
  })
})
