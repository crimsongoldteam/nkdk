import fs from "fs"
import os from "os"
import { dirname, join } from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { getXMLFixturePath, readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { importContentFromXML } from "~/xml/import/importer"
import { importConfigDumpInfoFromXML } from "../configDumpInfo/fromXML"
import type { ConfigDumpInfoXML } from "../configDumpInfo/types"
import { syncConfigurationFromXML } from "./convertFromXML"
import { CONFIGURATION_XML_FILE, CONFIGURATION_YAML_FILE } from "./rootIO"
import { syncConfigurationToXML } from "./syncToXML"

describe("sync configuration to XML", () => {
  const inputDir = getXMLFixturePath("sync/syncConfiguration/yaml")
  const referenceDir = getXMLFixturePath("sync/syncConfiguration/xml")
  const outputDir = getXMLFixturePath("sync/syncConfiguration/out-to-xml")
  const catalogName = "Контрагенты"

  beforeEach(() => {
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true })
    }
  })

  it("should read configuration from YAML and export to XML file in output dir", async () => {
    await syncConfigurationToXML({
      context: mockContextToXML(),
      inputDir,
      outputDir,
      referenceDir,
    })

    const expectedMetadataXML = readXMLFileAsString(join("sync/syncConfiguration/xml/Catalogs", `${catalogName}.xml`))
    const resultMetadataXML = readXMLFileAsString(join("sync/syncConfiguration/out-to-xml/Catalogs", `${catalogName}.xml`))
    expect(resultMetadataXML).toBe(expectedMetadataXML)

    const expectedFormXML = readXMLFileAsString(
      join("sync/syncConfiguration/xml/Catalogs", "Контрагенты", "Forms", "ФормаЭлемента", "Ext", "Form.xml")
    )
    const resultFormXML = readXMLFileAsString(
      join("sync/syncConfiguration/out-to-xml", "Catalogs", catalogName, "Forms", "ФормаЭлемента", "Ext", "Form.xml")
    )
    expect(resultFormXML).toBe(expectedFormXML)

    const expectedFormMetadataXML = readXMLFileAsString(
      join("sync/syncConfiguration/xml/Catalogs", catalogName, "Forms", "ФормаЭлемента.xml")
    )
    const resultFormMetadataXML = readXMLFileAsString(
      join("sync/syncConfiguration/out-to-xml", "Catalogs", catalogName, "Forms", "ФормаЭлемента.xml")
    )
    expect(resultFormMetadataXML).toBe(expectedFormMetadataXML)
  })

  it("пишет корневой Configuration.xml из Конфигурация.yaml и вычисляет пустой ChildObjects", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-root-to-xml-"))
    const yamlDir = join(tmp, "yaml")
    const xmlDir = join(tmp, "xml")
    const outDir = join(tmp, "out")
    try {
      fs.mkdirSync(yamlDir, { recursive: true })
      fs.mkdirSync(xmlDir, { recursive: true })
      fs.copyFileSync(getXMLFixturePath("configuration/full.xml"), join(xmlDir, CONFIGURATION_XML_FILE))
      fs.writeFileSync(join(yamlDir, CONFIGURATION_YAML_FILE), "Имя: Конфигурация\n", "utf-8")

      await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        outputDir: outDir,
        referenceDir: xmlDir,
      })

      const result = fs.readFileSync(join(outDir, CONFIGURATION_XML_FILE), "utf-8")
      expect(result).toContain("<ChildObjects/>")
      expect(result).not.toContain("<Catalog>")
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it("удаляет старый корневой Configuration.xml, если Конфигурация.yaml отсутствует", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-root-prune-"))
    const yamlDir = join(tmp, "yaml")
    const outDir = join(tmp, "out")
    try {
      fs.mkdirSync(yamlDir, { recursive: true })
      fs.mkdirSync(outDir, { recursive: true })
      fs.writeFileSync(join(outDir, CONFIGURATION_XML_FILE), "<MetaDataObject/>", "utf-8")

      await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        outputDir: outDir,
        referenceDir,
      })

      expect(fs.existsSync(join(outDir, CONFIGURATION_XML_FILE))).toBe(false)
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it("round-trip Document/DocumentNumerator/Sequence: XML → YAML → XML возвращает исходный XML", async () => {
    const tmpYamlDir = getXMLFixturePath("sync/syncConfiguration/_tmp_yaml")
    const tmpXmlDir = getXMLFixturePath("sync/syncConfiguration/_tmp_xml")
    if (fs.existsSync(tmpYamlDir)) fs.rmSync(tmpYamlDir, { recursive: true })
    if (fs.existsSync(tmpXmlDir)) fs.rmSync(tmpXmlDir, { recursive: true })
    fs.mkdirSync(tmpYamlDir, { recursive: true })
    fs.mkdirSync(tmpXmlDir, { recursive: true })

    // 1. XML → YAML
    await syncConfigurationFromXML({
      context: mockContextFromXML(),
      inputDir: referenceDir,
      outputDir: tmpYamlDir,
    })

    // 2. YAML → XML
    await syncConfigurationToXML({
      context: mockContextToXML(),
      inputDir: tmpYamlDir,
      outputDir: tmpXmlDir,
      referenceDir,
    })

    // DocumentNumerator и Sequence — полный round-trip (правила покрывают все поля фикстуры)
    for (const [xmlSubdir, fileName] of [
      ["DocumentNumerators", "НумераторПоУмолчанию.xml"],
      ["Sequences", "ПоследовательностьПоУмолчанию.xml"],
    ] as const) {
      const expected = readXMLFileAsString(join("sync/syncConfiguration/xml", xmlSubdir, fileName))
      const actual = readXMLFileAsString(join("sync/syncConfiguration/_tmp_xml", xmlSubdir, fileName))
      expect(actual, `mismatch in ${xmlSubdir}/${fileName}`).toBe(expected)
    }

    // Document — только проверка, что walker дошёл до Documents/ и создал XML.
    // Полный round-trip XML→YAML→XML для Document остаётся ослабленным и в этой
    // версии — не из-за `MetadataDocumentRules` (пробелы закрыты в PRD-1
    // `2026-04-26-metadata-document-round-trip-gaps`), а из-за общих
    // инфраструктурных ограничений, не входящих в границы того PRD:
    //   1. mockContextToXML не подкладывает фиксированный `uuid` в <Document>.
    //   2. StandardAttributeDescriptions сериализует атрибуты алфавитно,
    //      а реальная фикстура имеет порядок Posted/Ref/DeletionMark/Date/Number.
    //   3. InternalInfo-механизм для TabularSection зашит на CatalogTabularSection,
    //      а Document требует DocumentTabularSection.
    //   4. <Form>/<Template>: PRD-2 (Document — Forms/Templates/Modules/Help).
    //   5. У атрибутов сериализуется лишний <Use>ForItem</Use>
    //      (поведение общей сериализации атрибутов).
    // Поднять assertions до уровня Sequence/DocumentNumerator можно после
    // устранения каждого из пунктов выше — это отдельные тикеты вне границ
    // PRD-1.
    expect(
      fs.existsSync(join(tmpXmlDir, "Documents", "ДокументПоУмолчанию.xml")),
      "walker should produce Documents/ДокументПоУмолчанию.xml",
    ).toBe(true)

    fs.rmSync(tmpYamlDir, { recursive: true })
    fs.rmSync(tmpXmlDir, { recursive: true })
  })

  it("сохраняет uuid при переименовании справочника и реквизита через remap reference", async () => {
    const tmp = getXMLFixturePath("sync/syncConfiguration/_tmp_migration_rename")
    const yamlDir = join(tmp, "yaml")
    const xmlDir = join(tmp, "xml")
    const outDir = join(tmp, "out")
    if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true })
    fs.mkdirSync(join(yamlDir, "Справочник", "Номенклатура"), { recursive: true })
    fs.mkdirSync(join(yamlDir, "Миграции"), { recursive: true })
    fs.mkdirSync(join(xmlDir, "Catalogs"), { recursive: true })

    fs.writeFileSync(join(yamlDir, "Справочник", "Номенклатура", "Свойства.yaml"), [
      "Реквизиты:",
      "  НовыйАртикул:",
      "    Тип: string",
      "",
    ].join("\n"))
    fs.writeFileSync(join(yamlDir, "Миграции", "2026-05-05-143000.yaml"), [
      '"Справочник.Товары": "Номенклатура"',
      '"Справочник.Номенклатура.Реквизит.Артикул": "НовыйАртикул"',
      "",
    ].join("\n"))
    fs.writeFileSync(join(xmlDir, "Catalogs", "Товары.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" version="2.20">
	<Catalog uuid="00000000-0000-0000-0000-000000000001">
		<Properties>
			<Name>Товары</Name>
			<Synonym/>
			<Comment/>
			<UseStandardCommands>true</UseStandardCommands>
			<CodeLength>9</CodeLength>
			<DescriptionLength>25</DescriptionLength>
			<Hierarchical>false</Hierarchical>
			<FoldersOnTop>true</FoldersOnTop>
			<Owners/>
			<SubordinationUse>ToItems</SubordinationUse>
			<PredefinedDataUpdate>Auto</PredefinedDataUpdate>
			<FullTextSearch>Use</FullTextSearch>
			<ChoiceMode>BothWays</ChoiceMode>
			<DefaultPresentation>AsDescription</DefaultPresentation>
			<EditType>InDialog</EditType>
			<QuickChoice>true</QuickChoice>
			<IncludeHelpInContents>true</IncludeHelpInContents>
			<InputByString/>
			<SearchStringModeOnInputByString>Begin</SearchStringModeOnInputByString>
			<CreateOnInput>Use</CreateOnInput>
			<DataLockControlMode>Managed</DataLockControlMode>
			<ModalChoiceMode>Both</ModalChoiceMode>
			<DefaultObjectForm/>
			<DefaultFolderForm/>
			<DefaultListForm/>
			<DefaultChoiceForm/>
			<DefaultFolderChoiceForm/>
			<AuxiliaryObjectForm/>
			<AuxiliaryFolderForm/>
			<AuxiliaryListForm/>
			<AuxiliaryChoiceForm/>
			<AuxiliaryFolderChoiceForm/>
		</Properties>
		<ChildObjects>
			<Attribute uuid="00000000-0000-0000-0000-000000000101">
				<Properties>
					<Name>Артикул</Name>
					<Synonym/>
					<Comment/>
					<Type>
						<v8:Type>xs:string</v8:Type>
						<v8:StringQualifiers>
							<v8:Length>0</v8:Length>
							<v8:AllowedLength>Variable</v8:AllowedLength>
						</v8:StringQualifiers>
					</Type>
					<PasswordMode>false</PasswordMode>
					<Format/>
					<EditFormat/>
					<ToolTip/>
					<MarkNegatives>false</MarkNegatives>
					<Mask/>
					<MultiLine>false</MultiLine>
					<ExtendedEdit>false</ExtendedEdit>
					<MinValue xsi:nil="true"/>
					<MaxValue xsi:nil="true"/>
					<FillChecking>DontCheck</FillChecking>
					<ChoiceFoldersAndItems>Items</ChoiceFoldersAndItems>
					<ChoiceParameterLinks/>
					<ChoiceParameters/>
					<QuickChoice>Auto</QuickChoice>
					<CreateOnInput>Use</CreateOnInput>
					<ChoiceHistoryOnInput>Auto</ChoiceHistoryOnInput>
					<FullTextSearch>Use</FullTextSearch>
					<Use>ForItem</Use>
				</Properties>
			</Attribute>
		</ChildObjects>
	</Catalog>
</MetaDataObject>`, "utf-8")

    try {
      await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        outputDir: outDir,
        referenceDir: xmlDir,
      })

      const result = fs.readFileSync(join(outDir, "Catalogs", "Номенклатура.xml"), "utf-8")
      expect(result).toContain('<Catalog uuid="00000000-0000-0000-0000-000000000001">')
      expect(result).toContain('<Attribute uuid="00000000-0000-0000-0000-000000000101">')
      expect(result).toContain("<Name>НовыйАртикул</Name>")
    } finally {
      if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true })
    }
  })

  it("пишет ConfigDumpInfo.xml и добавляет новый объект", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-config-dump-info-new-"))
    const yamlDir = join(tmp, "yaml")
    const xmlDir = join(tmp, "xml")
    const outDir = join(tmp, "out")

    try {
      fs.mkdirSync(join(yamlDir, "Справочник", "Номенклатура"), { recursive: true })
      fs.mkdirSync(xmlDir, { recursive: true })
      fs.writeFileSync(join(yamlDir, "Справочник", "Номенклатура", "Свойства.yaml"), [
        "Реквизиты:",
        "  Артикул:",
        "    Тип: string",
        "",
      ].join("\n"))
      fs.writeFileSync(join(xmlDir, "ConfigDumpInfo.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<ConfigDumpInfo xmlns="http://v8.1c.ru/8.3/xcf/dumpinfo" xmlns:xen="http://v8.1c.ru/8.3/xcf/enums" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" format="Hierarchical" version="2.20">
	<ConfigVersions/>
</ConfigDumpInfo>`, "utf-8")

      const result = await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        outputDir: outDir,
        referenceDir: xmlDir,
      })

      expect(result.failed).toEqual([])
      const xml = fs.readFileSync(join(outDir, "ConfigDumpInfo.xml"), "utf-8")
      expect(xml).toContain('name="Catalog.Номенклатура"')
      expect(xml).toContain('name="Catalog.Номенклатура.Attribute.Артикул"')
      expect(xml).toMatch(/configVersion="[0-9a-f]{40}"/)
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it("переносит ConfigDumpInfo при переименовании и удаляет старое имя", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-config-dump-info-rename-"))
    const yamlDir = join(tmp, "yaml")
    const xmlDir = join(tmp, "xml")
    const outDir = join(tmp, "out")

    try {
      fs.mkdirSync(join(yamlDir, "Справочник", "Номенклатура"), { recursive: true })
      fs.mkdirSync(join(yamlDir, "Миграции"), { recursive: true })
      fs.mkdirSync(join(xmlDir, "Catalogs"), { recursive: true })
      fs.writeFileSync(join(yamlDir, "Справочник", "Номенклатура", "Свойства.yaml"), [
        "Реквизиты:",
        "  КодАртикула:",
        "    Тип: string",
        "",
      ].join("\n"))
      fs.writeFileSync(join(yamlDir, "Миграции", "2026-05-05-143000.yaml"), [
        '"Справочник.Товары": "Номенклатура"',
        '"Справочник.Номенклатура.Реквизит.Артикул": "КодАртикула"',
        "",
      ].join("\n"))
      fs.writeFileSync(join(xmlDir, "Catalogs", "Товары.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" version="2.20">
	<Catalog uuid="00000000-0000-0000-0000-000000000001">
		<Properties><Name>Товары</Name><Synonym/><Comment/></Properties>
		<ChildObjects>
			<Attribute uuid="00000000-0000-0000-0000-000000000101">
				<Properties><Name>Артикул</Name><Synonym/><Comment/></Properties>
			</Attribute>
		</ChildObjects>
	</Catalog>
</MetaDataObject>`, "utf-8")
      fs.writeFileSync(join(xmlDir, "ConfigDumpInfo.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<ConfigDumpInfo xmlns="http://v8.1c.ru/8.3/xcf/dumpinfo" xmlns:xen="http://v8.1c.ru/8.3/xcf/enums" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" format="Hierarchical" version="2.20">
	<ConfigVersions>
		<Metadata name="Catalog.Товары" id="catalog-id" configVersion="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa">
			<Metadata name="Catalog.Товары.Attribute.Артикул" id="attribute-id"/>
		</Metadata>
		<Metadata name="Catalog.Товары.Form.ФормаЭлемента" id="form-id" configVersion="cccccccccccccccccccccccccccccccccccccccc"/>
	</ConfigVersions>
</ConfigDumpInfo>`, "utf-8")

      const context = mockContextToXML()
      const result = await syncConfigurationToXML({
        context,
        inputDir: yamlDir,
        outputDir: outDir,
        referenceDir: xmlDir,
      })

      expect(result.failed).toEqual([])
      const parsed = importContentFromXML<{ ConfigDumpInfo: ConfigDumpInfoXML }>(
        fs.readFileSync(join(outDir, "ConfigDumpInfo.xml"), "utf-8"),
      )
      const idMap = importConfigDumpInfoFromXML({ context, xml: parsed.ConfigDumpInfo })
      const catalogEntry = idMap.get("Catalog.Номенклатура")
      const formEntry = idMap.get("Catalog.Номенклатура.Form.ФормаЭлемента")

      expect(idMap.has("Catalog.Товары")).toBe(false)
      expect(catalogEntry?.id).toBe("catalog-id")
      expect(catalogEntry?.configVersion).toBe("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
      expect(catalogEntry?.children.get("Catalog.Номенклатура.Attribute.КодАртикула")).toBe("attribute-id")
      expect(catalogEntry?.children.has("Catalog.Номенклатура.Attribute.Артикул")).toBe(false)
      expect(formEntry?.id).toBe("form-id")
      expect(formEntry?.configVersion).toBe("cccccccccccccccccccccccccccccccccccccccc")
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it("останавливает sync при конфликте без миграции", async () => {
    const tmp = getXMLFixturePath("sync/syncConfiguration/_tmp_migration_conflict")
    const yamlDir = join(tmp, "yaml")
    const xmlDir = join(tmp, "xml")
    const outDir = join(tmp, "out")
    if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true })
    fs.mkdirSync(join(yamlDir, "Справочник", "Номенклатура"), { recursive: true })
    fs.mkdirSync(join(xmlDir, "Catalogs"), { recursive: true })

    fs.writeFileSync(join(yamlDir, "Справочник", "Номенклатура", "Свойства.yaml"), "")
    fs.writeFileSync(join(xmlDir, "Catalogs", "Товары.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" version="2.20">
	<Catalog uuid="00000000-0000-0000-0000-000000000001">
		<Properties><Name>Товары</Name><Synonym/><Comment/></Properties>
	</Catalog>
</MetaDataObject>`, "utf-8")

    try {
      const result = await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        outputDir: outDir,
        referenceDir: xmlDir,
      })

      expect(result.failed[0]?.error.message).toContain("Найдены возможные переименования")
      expect(result.failed[0]?.error.message).toContain("nkdk generate-migration")
    } finally {
      if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true })
    }
  })

  it("пишет .nakidka-migrations.yaml после успешного sync", async () => {
    const tmp = getXMLFixturePath("sync/syncConfiguration/_tmp_migration_state")
    const yamlDir = join(tmp, "yaml")
    const xmlDir = join(tmp, "xml")
    const outDir = join(tmp, "out")
    if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true })
    fs.mkdirSync(join(yamlDir, "Справочник", "Товары"), { recursive: true })
    fs.writeFileSync(join(yamlDir, "Справочник", "Товары", "Свойства.yaml"), "")

    try {
      const result = await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        outputDir: outDir,
        referenceDir: xmlDir,
      })

      expect(result.failed).toEqual([])
      expect(fs.readFileSync(join(outDir, ".nakidka-migrations.yaml"), "utf-8")).toBe("applied: []\n")
    } finally {
      if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true })
    }
  })

  it("пишет внешние файлы объекта в директорию объекта при configuration sync", async () => {
    const tmp = getXMLFixturePath("sync/syncConfiguration/_tmp_external_files")
    const yamlDir = join(tmp, "yaml")
    const xmlDir = join(tmp, "xml")
    const outDir = join(tmp, "out")
    if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true })
    fs.mkdirSync(join(yamlDir, "Справочник", "Товары"), { recursive: true })
    fs.writeFileSync(join(yamlDir, "Справочник", "Товары", "Свойства.yaml"), "")
    fs.writeFileSync(join(yamlDir, "Справочник", "Товары", "МодульОбъекта.bsl"), "Процедура Проверка()\nКонецПроцедуры\n")

    try {
      const result = await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        outputDir: outDir,
        referenceDir: xmlDir,
      })

      expect(result.failed).toEqual([])
      expect(fs.readFileSync(join(outDir, "Catalogs", "Товары", "Ext", "ObjectModule.bsl"), "utf-8")).toBe(
        "Процедура Проверка()\nКонецПроцедуры\n",
      )
      expect(fs.existsSync(join(outDir, "Catalogs", "Ext", "ObjectModule.bsl"))).toBe(false)
    } finally {
      if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true })
    }
  })

  it("пишет шаблоны дочерних объектов без повторного имени объекта", async () => {
    const tmp = getXMLFixturePath("sync/syncConfiguration/_tmp_child_templates")
    const yamlDir = join(tmp, "yaml")
    const xmlDir = join(tmp, "xml")
    const outDir = join(tmp, "out")
    const name = "ТестовоеХранилище"
    if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true })
    fs.mkdirSync(join(yamlDir, "ХранилищеНастроек", name, "Шаблоны", "Макет"), { recursive: true })
    fs.writeFileSync(join(yamlDir, "ХранилищеНастроек", name, "Свойства.yaml"), [
      "Синоним: Тестовое хранилище",
      "Шаблоны:",
      "  - Макет",
      "",
    ].join("\n"))
    fs.writeFileSync(join(yamlDir, "ХранилищеНастроек", name, "Шаблоны", "Макет", "Template.xml"), "<Template/>")
    fs.writeFileSync(join(yamlDir, "ХранилищеНастроек", name, "Шаблоны", "Макет", "Template.txt"), "template text")

    try {
      const result = await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        outputDir: outDir,
        referenceDir: xmlDir,
      })

      expect(result.failed).toEqual([])
      expect(
        fs.readFileSync(join(outDir, "SettingsStorages", name, "Templates", "Макет", "Ext", "Template.txt"), "utf-8"),
      ).toBe("template text")
      expect(fs.existsSync(join(outDir, "SettingsStorages", name, name, "Templates", "Макет", "Ext", "Template.txt"))).toBe(false)
    } finally {
      if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true })
    }
  })

  it("не удаляет поддержанные внешние файлы после manifest prune", async () => {
    const tmp = getXMLFixturePath("sync/syncConfiguration/_tmp_manifest_external_files")
    const yamlDir = join(tmp, "yaml")
    const outDir = join(tmp, "out")
    if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true })
    fs.mkdirSync(tmp, { recursive: true })
    fs.cpSync(inputDir, yamlDir, { recursive: true })

    writeTestFile(join(yamlDir, "ОбщийМакет", "ДвоичныйМакет", "Свойства.yaml"), "ВидМакета: BinaryData\n")
    writeTestFile(join(yamlDir, "ОбщийМакет", "ДвоичныйМакет", "Template.bin"), Buffer.from([1, 2, 3]))
    writeTestFile(join(yamlDir, "Справочник", catalogName, "Справка", "ru.html"), "<html>help</html>")
    writeTestFile(join(yamlDir, "Справочник", catalogName, "Справка", "_files", "logo.png"), Buffer.from([4, 5, 6]))
    writeTestFile(
      join(yamlDir, "Справочник", catalogName, "Формы", "ФормаЭлемента", "Картинки", "ПолеВвода1.png"),
      Buffer.from([7, 8, 9]),
    )
    writeTestFile(
      join(yamlDir, "Справочник", catalogName, "Формы", "ФормаЭлемента", "КартинкиЗначений", "ПолеВвода1.bmp"),
      Buffer.from([10, 11, 12]),
    )
    writeTestFile(join(yamlDir, "WSСсылка", "Калькулятор", "Свойства.yaml"), "URL: http://example.test/wsdl\n")
    writeTestFile(join(yamlDir, "WSСсылка", "Калькулятор", "WSDefinition.xml"), "<definitions/>")
    writeTestFile(join(yamlDir, "WSСсылка", "Калькулятор", "XSD", "schema.xsd"), "<xs:schema/>")

    writeTestFile(join(outDir, "CommonTemplates", "ДвоичныйМакет", "Ext", "stale.bin"), "stale")
    writeTestFile(join(outDir, "Catalogs", catalogName, "Ext", "Help", "_files", "stale.png"), "stale")
    writeTestFile(
      join(outDir, "Catalogs", catalogName, "Forms", "ФормаЭлемента", "Ext", "Form", "Items", "ПолеВвода1", "Stale.png"),
      "stale",
    )
    writeTestFile(join(outDir, "WSReferences", "Калькулятор", "Ext", "stale.xsd"), "stale")

    try {
      const result = await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        outputDir: outDir,
        referenceDir,
      })

      expect(result.failed).toEqual([])
      expect([...fs.readFileSync(join(outDir, "CommonTemplates", "ДвоичныйМакет", "Ext", "Template.bin"))]).toEqual([
        1,
        2,
        3,
      ])
      expect([...fs.readFileSync(join(outDir, "Catalogs", catalogName, "Ext", "Help", "_files", "logo.png"))]).toEqual([
        4,
        5,
        6,
      ])
      expect([
        ...fs.readFileSync(
          join(
            outDir,
            "Catalogs",
            catalogName,
            "Forms",
            "ФормаЭлемента",
            "Ext",
            "Form",
            "Items",
            "ПолеВвода1",
            "Picture.png",
          )
        ),
      ]).toEqual([7, 8, 9])
      expect([
        ...fs.readFileSync(
          join(
            outDir,
            "Catalogs",
            catalogName,
            "Forms",
            "ФормаЭлемента",
            "Ext",
            "Form",
            "Items",
            "ПолеВвода1",
            "ValuesPicture.bmp",
          )
        ),
      ]).toEqual([10, 11, 12])
      expect(fs.readFileSync(join(outDir, "WSReferences", "Калькулятор", "Ext", "schema.xsd"), "utf-8")).toBe(
        "<xs:schema/>"
      )

      expect(fs.existsSync(join(outDir, "CommonTemplates", "ДвоичныйМакет", "Ext", "stale.bin"))).toBe(false)
      expect(fs.existsSync(join(outDir, "Catalogs", catalogName, "Ext", "Help", "_files", "stale.png"))).toBe(false)
      expect(
        fs.existsSync(
          join(
            outDir,
            "Catalogs",
            catalogName,
            "Forms",
            "ФормаЭлемента",
            "Ext",
            "Form",
            "Items",
            "ПолеВвода1",
            "Stale.png",
          )
        )
      ).toBe(false)
      expect(fs.existsSync(join(outDir, "WSReferences", "Калькулятор", "Ext", "stale.xsd"))).toBe(false)
    } finally {
      if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true })
    }
  })
})

const writeTestFile = (path: string, content: string | Buffer): void => {
  fs.mkdirSync(dirname(path), { recursive: true })
  fs.writeFileSync(path, content)
}
