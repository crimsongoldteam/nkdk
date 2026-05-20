import fs from "fs"
import { dirname, join } from "path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { XmlSyncManifest } from "~/metadata/appliedObjects/configuration/migrations/xmlManifest"
import { getXMLFixturePath } from "~/tests/readAndParseXMLFile"
import type { HelpPropertyRule } from "~/metadata/orchestration/property/types"
import { importContentFromXML } from "~/xml/import/importer"
import { syncHelpFromXML } from "./fromXML"
import { syncHelpToXML } from "./toXML"

describe("syncHelp", () => {
  const tmpRoot = getXMLFixturePath("sync/syncConfiguration/_tmp_help_sync")
  const rule: HelpPropertyRule = {
    type: "Help",
    filePath: "Ext/Help.xml",
    nkdkDir: "Справка",
  }

  beforeEach(() => {
    if (fs.existsSync(tmpRoot)) fs.rmSync(tmpRoot, { recursive: true })
  })

  afterEach(() => {
    if (fs.existsSync(tmpRoot)) fs.rmSync(tmpRoot, { recursive: true })
  })

  it("fromXML копирует только страницы, перечисленные в Ext/Help.xml", async () => {
    const xmlDir = join(tmpRoot, "xml")
    const nkdkDir = join(tmpRoot, "nkdk")
    const helpXmlPath = join(xmlDir, "Ext", "Help.xml")
    const helpDir = join(xmlDir, "Ext", "Help")
    fs.mkdirSync(dirname(helpXmlPath), { recursive: true })
    fs.mkdirSync(helpDir, { recursive: true })
    fs.writeFileSync(
      helpXmlPath,
      `<?xml version="1.0" encoding="UTF-8"?>\n<Help xmlns="http://v8.1c.ru/8.3/xcf/extrnprops" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">\n\t<Page>ru</Page>\n</Help>`,
      "utf-8",
    )
    fs.writeFileSync(join(helpDir, "ru.html"), "<html>current</html>", "utf-8")
    fs.writeFileSync(join(helpDir, "stale.html"), "<html>stale</html>", "utf-8")
    fs.mkdirSync(join(helpDir, "_files"), { recursive: true })
    fs.writeFileSync(join(helpDir, "_files", "logo.png"), Buffer.from([137, 80]))

    await syncHelpFromXML({ rule, xmlDir, nkdkDir })

    expect(fs.existsSync(join(nkdkDir, "Справка", "ru.html"))).toBe(true)
    expect(fs.existsSync(join(nkdkDir, "Справка", "stale.html"))).toBe(false)
    expect([...fs.readFileSync(join(nkdkDir, "Справка", "_files", "logo.png"))]).toEqual([137, 80])
  })

  it("toXML пересобирает Ext/Help.xml по текущим страницам nkdk", async () => {
    const nkdkDir = join(tmpRoot, "nkdk")
    const xmlDir = join(tmpRoot, "xml")
    const nkdkHelpDir = join(nkdkDir, "Справка")
    fs.mkdirSync(nkdkHelpDir, { recursive: true })
    fs.writeFileSync(join(nkdkHelpDir, "ru.html"), "<html>ru</html>", "utf-8")
    fs.writeFileSync(join(nkdkHelpDir, "en.html"), "<html>en</html>", "utf-8")
    fs.mkdirSync(join(nkdkHelpDir, "_files"), { recursive: true })
    fs.writeFileSync(join(nkdkHelpDir, "_files", "logo.png"), Buffer.from([137, 80]))
    const xmlManifest = new XmlSyncManifest(xmlDir)

    await syncHelpToXML({ rule, nkdkDir, xmlDir, xmlManifest })

    const helpXmlContent = fs.readFileSync(join(xmlDir, "Ext", "Help.xml"), "utf-8")
    const helpParsed = importContentFromXML<{ Help: { Page?: string | string[] } }>(helpXmlContent)
    const pages = helpParsed.Help.Page
    const pageList = pages === undefined ? [] : Array.isArray(pages) ? pages : [pages]

    expect(pageList.sort()).toEqual(["en", "ru"])
    expect(fs.existsSync(join(xmlDir, "Ext", "Help", "ru.html"))).toBe(true)
    expect(fs.existsSync(join(xmlDir, "Ext", "Help", "en.html"))).toBe(true)
    expect([...fs.readFileSync(join(xmlDir, "Ext", "Help", "_files", "logo.png"))]).toEqual([137, 80])
    expect(xmlManifest.expectedFiles()).toContain("Ext/Help/_files/logo.png")
  })
})
