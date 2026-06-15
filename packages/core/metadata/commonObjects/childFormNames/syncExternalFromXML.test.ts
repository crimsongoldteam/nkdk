import fs from "fs"
import { dirname, join } from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { mockContextFromXML } from "~/tests/mockContext"
import { getXMLFixturePath } from "~/tests/readAndParseXMLFile"
import { MetadataCatalogRules } from "~/metadata/appliedObjects/metadataCatalog/rules"
import { convertAppliedObjectFromXML } from "~/metadata/orchestration/appliedObject/convertFromXML"

describe("syncChildFormNamesFromXML (через convertAppliedObjectFromXML)", () => {
  const inputDir = getXMLFixturePath("sync/syncConfiguration/xml/Catalogs")
  const outputDir = getXMLFixturePath("sync/syncConfiguration/_tmp_form_hook_in")
  const name = "Контрагенты"

  beforeEach(() => {
    if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true })
  })

  it("записывает Формы/<form>/Форма.yaml для каталога", async () => {
    await convertAppliedObjectFromXML({
      rule: MetadataCatalogRules,
      context: mockContextFromXML(),
      inputDir,
      name,
      outputDir,
    })

    const yamlPath = join(outputDir, name, "Формы", "ФормаЭлемента", "Форма.yaml")

    expect(fs.existsSync(yamlPath), `expected ${yamlPath}`).toBe(true)

    fs.rmSync(outputDir, { recursive: true })
  })

  it("экспортирует ссылку на текущую форму в настройках формы локальным именем", async () => {
    const tmpRoot = getXMLFixturePath("sync/syncConfiguration/_tmp_form_owner_in")
    const tmpInputDir = join(tmpRoot, "xml", "Catalogs")
    const tmpOutputDir = join(tmpRoot, "yaml")
    const sourceDir = getXMLFixturePath("sync/syncConfiguration/xml/Catalogs")
    if (fs.existsSync(tmpRoot)) fs.rmSync(tmpRoot, { recursive: true })
    fs.cpSync(sourceDir, tmpInputDir, { recursive: true })

    const formPath = join(tmpInputDir, name, "Forms", "ФормаЭлемента", "Ext", "Form.xml")
    const formXml = fs.readFileSync(formPath, "utf-8")
    fs.writeFileSync(
      formPath,
      formXml.replace(
        /(<Form\b[^>]*>\s*)/,
        `$1\n\t<SettingsStorage>Catalog.${name}.Form.ФормаЭлемента</SettingsStorage>`
      ),
      "utf-8"
    )

    await convertAppliedObjectFromXML({
      rule: MetadataCatalogRules,
      context: mockContextFromXML(),
      inputDir: tmpInputDir,
      name,
      outputDir: tmpOutputDir,
    })

    const yaml = fs.readFileSync(join(tmpOutputDir, name, "Формы", "ФормаЭлемента", "Форма.yaml"), "utf-8")
    expect(yaml).toContain("ХранилищеНастроек: ФормаЭлемента")

    fs.rmSync(tmpRoot, { recursive: true })
  })

  it("импортирует только страницы справки формы, перечисленные в Forms/<form>/Ext/Help.xml", async () => {
    const tmpRoot = getXMLFixturePath("sync/syncConfiguration/_tmp_form_help_in")
    const tmpInputDir = join(tmpRoot, "xml", "Catalogs")
    const tmpOutputDir = join(tmpRoot, "yaml")
    const sourceDir = getXMLFixturePath("sync/syncConfiguration/xml/Catalogs")
    if (fs.existsSync(tmpRoot)) fs.rmSync(tmpRoot, { recursive: true })
    fs.cpSync(sourceDir, tmpInputDir, { recursive: true })

    const helpXmlPath = join(tmpInputDir, name, "Forms", "ФормаЭлемента", "Ext", "Help.xml")
    const helpDir = join(tmpInputDir, name, "Forms", "ФормаЭлемента", "Ext", "Help")
    fs.mkdirSync(dirname(helpXmlPath), { recursive: true })
    fs.mkdirSync(helpDir, { recursive: true })
    fs.writeFileSync(
      helpXmlPath,
      `<?xml version="1.0" encoding="UTF-8"?>\n<Help xmlns="http://v8.1c.ru/8.3/xcf/extrnprops" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">\n\t<Page>ru</Page>\n</Help>`,
      "utf-8",
    )
    fs.writeFileSync(join(helpDir, "ru.html"), "<html>current</html>", "utf-8")
    fs.writeFileSync(join(helpDir, "stale.html"), "<html>stale</html>", "utf-8")

    await convertAppliedObjectFromXML({
      rule: MetadataCatalogRules,
      context: mockContextFromXML(),
      inputDir: tmpInputDir,
      name,
      outputDir: tmpOutputDir,
    })

    const formHelpDir = join(tmpOutputDir, name, "Формы", "ФормаЭлемента", "Справка")
    expect(fs.existsSync(join(formHelpDir, "ru.html"))).toBe(true)
    expect(fs.existsSync(join(formHelpDir, "stale.html"))).toBe(false)

    fs.rmSync(tmpRoot, { recursive: true })
  })
})
