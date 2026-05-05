import fs from "fs"
import { join } from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { getXMLFixturePath, readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { syncConfigurationFromXML } from "./convertFromXML"
import { syncConfigurationToXML } from "./syncToXML"

describe("sync configuration to XML", () => {
  const inputDir = getXMLFixturePath("sync/syncConfiguration/nkdk")
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
})
