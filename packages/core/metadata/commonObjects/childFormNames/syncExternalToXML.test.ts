import fs from "fs"
import { dirname, join } from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { mockContextToXML } from "~/tests/mockContext"
import { getXMLFixturePath } from "~/tests/readAndParseXMLFile"
import { MetadataCatalogRules } from "~/metadata/appliedObjects/metadataCatalog/rules"
import { syncAppliedObjectToXML } from "~/metadata/orchestration/appliedObject/syncToXML"
import { importContentFromXML } from "~/xml/import/importer"
import { buildChildFormCurrentXMLPath } from "./syncExternalToXML"

describe("syncChildFormNamesToXML (через syncAppliedObjectToXML)", () => {
  const inputDir = getXMLFixturePath("sync/syncConfiguration/yaml/Справочник")
  const referenceDir = getXMLFixturePath("sync/syncConfiguration/xml/Catalogs")
  const outputDir = getXMLFixturePath("sync/syncConfiguration/_tmp_form_hook_out")
  const name = "Контрагенты"

  beforeEach(() => {
    if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true })
  })

  it("строит currentXMLPath с POSIX-разделителями", () => {
    expect(
      buildChildFormCurrentXMLPath({
        xmlDir: "C:\\repo\\xml\\Catalogs",
        name: "СпособыОтраженияРасходовПоАмортизацииМСФО",
        formName: "ФормаСписка",
      })
    ).toBe("Catalogs/СпособыОтраженияРасходовПоАмортизацииМСФО/Forms/ФормаСписка/Ext/Form.xml")
  })

  it("строит currentXMLPath по явному XML-каталогу текущего объекта", () => {
    expect(
      buildChildFormCurrentXMLPath({
        xmlDir: "/tmp/out/Cubes/Куб/DimensionTables/ТаблицаИзмерения",
        currentXMLDir: "Cubes/Куб/DimensionTables/ТаблицаИзмерения",
        name: "",
        formName: "ФормаСписка",
      })
    ).toBe("Cubes/Куб/DimensionTables/ТаблицаИзмерения/Forms/ФормаСписка/Ext/Form.xml")
  })

  it("записывает Forms/<form>.xml и Forms/<form>/Ext/Form.xml для каталога", async () => {
    await syncAppliedObjectToXML({
      rule: MetadataCatalogRules,
      context: mockContextToXML(),
      inputDir,
      name,
      outputDir,
      referenceDir,
    })

    const formMetadataPath = join(outputDir, name, "Forms", "ФормаЭлемента.xml")
    const formXmlPath = join(outputDir, name, "Forms", "ФормаЭлемента", "Ext", "Form.xml")

    expect(fs.existsSync(formMetadataPath), `expected ${formMetadataPath}`).toBe(true)
    expect(fs.existsSync(formXmlPath), `expected ${formXmlPath}`).toBe(true)

    fs.rmSync(outputDir, { recursive: true })
  })

  it("записывает формы каталога без referenceDir", async () => {
    await syncAppliedObjectToXML({
      rule: MetadataCatalogRules,
      context: mockContextToXML(),
      inputDir,
      name,
      outputDir,
    })

    const formMetadataPath = join(outputDir, name, "Forms", "ФормаЭлемента.xml")
    const formXmlPath = join(outputDir, name, "Forms", "ФормаЭлемента", "Ext", "Form.xml")

    expect(fs.existsSync(formMetadataPath), `expected ${formMetadataPath}`).toBe(true)
    expect(fs.existsSync(formXmlPath), `expected ${formXmlPath}`).toBe(true)

    fs.rmSync(outputDir, { recursive: true })
  })

  it("пересобирает Forms/<form>/Ext/Help.xml по текущим страницам nkdk, не копируя stale reference", async () => {
    const tmpRoot = getXMLFixturePath("sync/syncConfiguration/_tmp_form_help_out")
    const tmpInputDir = join(tmpRoot, "nkdk", "Справочник")
    const tmpReferenceDir = join(tmpRoot, "xml", "Catalogs")
    const tmpOutputDir = join(tmpRoot, "out")
    if (fs.existsSync(tmpRoot)) fs.rmSync(tmpRoot, { recursive: true })
    fs.cpSync(inputDir, tmpInputDir, { recursive: true })
    fs.cpSync(referenceDir, tmpReferenceDir, { recursive: true })

    const formHelpDir = join(tmpInputDir, name, "Формы", "ФормаЭлемента", "Справка")
    fs.mkdirSync(formHelpDir, { recursive: true })
    fs.writeFileSync(join(formHelpDir, "ru.html"), "<html>ru</html>", "utf-8")
    fs.writeFileSync(join(formHelpDir, "en.html"), "<html>en</html>", "utf-8")

    const referenceHelpXmlPath = join(tmpReferenceDir, name, "Forms", "ФормаЭлемента", "Ext", "Help.xml")
    const referenceHelpDir = join(tmpReferenceDir, name, "Forms", "ФормаЭлемента", "Ext", "Help")
    fs.mkdirSync(dirname(referenceHelpXmlPath), { recursive: true })
    fs.mkdirSync(referenceHelpDir, { recursive: true })
    fs.writeFileSync(
      referenceHelpXmlPath,
      `<?xml version="1.0" encoding="UTF-8"?>\n<Help xmlns="http://v8.1c.ru/8.3/xcf/extrnprops" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">\n\t<Page>stale</Page>\n</Help>`,
      "utf-8",
    )
    fs.writeFileSync(join(referenceHelpDir, "stale.html"), "<html>stale</html>", "utf-8")

    await syncAppliedObjectToXML({
      rule: MetadataCatalogRules,
      context: mockContextToXML(),
      inputDir: tmpInputDir,
      name,
      outputDir: tmpOutputDir,
      referenceDir: tmpReferenceDir,
    })

    const helpXmlPath = join(tmpOutputDir, name, "Forms", "ФормаЭлемента", "Ext", "Help.xml")
    const helpXmlContent = fs.readFileSync(helpXmlPath, "utf-8")
    const helpParsed = importContentFromXML<{ Help: { Page?: string | string[] } }>(helpXmlContent)
    const pages = helpParsed.Help.Page
    const pageList = pages === undefined ? [] : Array.isArray(pages) ? pages : [pages]

    expect(pageList.sort()).toEqual(["en", "ru"])
    expect(fs.existsSync(join(tmpOutputDir, name, "Forms", "ФормаЭлемента", "Ext", "Help", "ru.html"))).toBe(true)
    expect(fs.existsSync(join(tmpOutputDir, name, "Forms", "ФормаЭлемента", "Ext", "Help", "en.html"))).toBe(true)
    expect(fs.existsSync(join(tmpOutputDir, name, "Forms", "ФормаЭлемента", "Ext", "Help", "stale.html"))).toBe(false)

    fs.rmSync(tmpRoot, { recursive: true })
  })
})
