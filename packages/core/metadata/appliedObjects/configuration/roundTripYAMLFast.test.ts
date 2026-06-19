import fs from "fs"
import os from "os"
import { dirname, join } from "path"
import { describe, expect, it } from "vitest"
import { roundTripYAMLFast } from "./roundTripYAMLFast"

const enumXml = (params: { name: string; choiceMode?: string }): string => `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
	<Enum uuid="d381585b-33ee-4f3e-9362-ae06f761f29d">
		<Properties>
			<Name>${params.name}</Name>
			<Synonym>
				<v8:item>
					<v8:lang>ru</v8:lang>
					<v8:content>${params.name}</v8:content>
				</v8:item>
			</Synonym>
			<Comment/>
			<UseStandardCommands>false</UseStandardCommands>
			<QuickChoice>true</QuickChoice>
			${params.choiceMode === undefined ? "" : `<ChoiceMode>${params.choiceMode}</ChoiceMode>`}
			<DefaultListForm/>
			<DefaultChoiceForm/>
			<AuxiliaryListForm/>
			<AuxiliaryChoiceForm/>
			<ListPresentation/>
			<ExtendedListPresentation/>
			<Explanation/>
			<ChoiceHistoryOnInput>Auto</ChoiceHistoryOnInput>
			<Characteristics/>
		</Properties>
		<ChildObjects/>
		<InternalInfo>
			<xr:GeneratedType name="EnumRef.${params.name}" category="Ref">
				<xr:TypeId>b84bb78b-3bc6-4473-9d76-c7e109b970b2</xr:TypeId>
				<xr:ValueId>b6de8d44-cfa0-4f70-a89f-9f3098045cd4</xr:ValueId>
			</xr:GeneratedType>
			<xr:GeneratedType name="EnumManager.${params.name}" category="Manager">
				<xr:TypeId>ad948a32-45c8-4cc2-9d79-da7d96fd1e19</xr:TypeId>
				<xr:ValueId>d32b60ed-b5c6-47a3-aa22-f16a7415e1da</xr:ValueId>
			</xr:GeneratedType>
			<xr:GeneratedType name="EnumList.${params.name}" category="List">
				<xr:TypeId>5a2f483e-6883-4f5e-8784-bc2d5e96c4ba</xr:TypeId>
				<xr:ValueId>976deee1-c599-4271-a10a-ee31d333e68d</xr:ValueId>
			</xr:GeneratedType>
		</InternalInfo>
	</Enum>
</MetaDataObject>`

const externalDataSourceXml = (params: { name: string }): string => `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
	<ExternalDataSource uuid="aa0a162f-bf96-4951-9c81-f6a8014ab7e8">
		<InternalInfo>
			<xr:GeneratedType name="ExternalDataSourceManager.${params.name}" category="Manager">
				<xr:TypeId>a4ef7100-9959-4442-baf4-787c10c5e21d</xr:TypeId>
				<xr:ValueId>89d407e9-dd88-4734-896d-807c3768ba23</xr:ValueId>
			</xr:GeneratedType>
			<xr:GeneratedType name="ExternalDataSourceTablesManager.${params.name}" category="TablesManager">
				<xr:TypeId>9845972e-4d29-4fda-ab72-c7a6b981c440</xr:TypeId>
				<xr:ValueId>7010ece1-b27d-4e92-a012-b9ba45db751f</xr:ValueId>
			</xr:GeneratedType>
			<xr:GeneratedType name="ExternalDataSourceCubesManager.${params.name}" category="CubesManager">
				<xr:TypeId>0ca57e3a-b717-4edc-be5e-e333ac1cf78c</xr:TypeId>
				<xr:ValueId>74742986-68bc-418c-8396-8dc92ffa6da5</xr:ValueId>
			</xr:GeneratedType>
		</InternalInfo>
		<Properties>
			<Name>${params.name}</Name>
			<Synonym/>
			<Comment/>
			<DataLockControlMode>Automatic</DataLockControlMode>
		</Properties>
		<ChildObjects>
			<Table>ТаблицаВсеСвойства</Table>
			<Table>ТаблицаПоУмолчанию</Table>
			<Cube>КубВсеСвойства</Cube>
			<Cube>КубПоУмолчанию</Cube>
		</ChildObjects>
	</ExternalDataSource>
</MetaDataObject>`

const makeXmlProject = (xml: string): string => {
  const dir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-round-trip-yaml-fast-"))
  fs.mkdirSync(join(dir, "Enums"), { recursive: true })
  fs.writeFileSync(join(dir, "Enums", "ВидыСервисовЭДО.xml"), xml, "utf-8")
  return dir
}

const makeExternalDataSourceXmlProject = (xml: string): string => {
  const dir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-round-trip-yaml-fast-"))
  fs.mkdirSync(join(dir, "ExternalDataSources"), { recursive: true })
  fs.writeFileSync(join(dir, "ExternalDataSources", "ВнешнийИсточникДанныхВсеСвойства.xml"), xml, "utf-8")
  return dir
}

const externalDataSourceFixtureRoot = join(
  import.meta.dirname,
  "../metadataExternalDataSource/__fixtures__/sync/xml/ВнешнийИсточникДанныхВсеСвойства"
)

const makeExternalDataSourceFixtureProject = (): string => {
  const dir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-round-trip-yaml-fast-eds-"))
  const sourceRootXml = `${externalDataSourceFixtureRoot}.xml`
  const targetRootXml = join(dir, "ExternalDataSources", "ВнешнийИсточникДанныхВсеСвойства.xml")
  fs.mkdirSync(dirname(targetRootXml), { recursive: true })
  fs.copyFileSync(sourceRootXml, targetRootXml)
  fs.cpSync(externalDataSourceFixtureRoot, join(dir, "ExternalDataSources", "ВнешнийИсточникДанныхВсеСвойства"), {
    recursive: true,
  })
  return dir
}

const corruptFixtureFile = (xmlDir: string, relativePath: string): void => {
  fs.writeFileSync(join(xmlDir, relativePath), "<broken>", "utf-8")
}

const catalogWithFormXml = (params: { name: string; formName: string }): string => `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
	<Catalog uuid="11111111-1111-1111-1111-111111111111">
		<Properties>
			<Name>${params.name}</Name>
			<Synonym/>
			<Comment/>
			<UseStandardCommands>true</UseStandardCommands>
			<DefaultPresentation>AsDescription</DefaultPresentation>
			<EditType>InDialog</EditType>
			<QuickChoice>false</QuickChoice>
			<ChoiceMode>BothWays</ChoiceMode>
			<CodeLength>9</CodeLength>
			<DescriptionLength>25</DescriptionLength>
			<CodeType>String</CodeType>
			<CodeAllowedLength>Variable</CodeAllowedLength>
			<CheckUnique>true</CheckUnique>
			<Autonumbering>true</Autonumbering>
			<Characteristics/>
		</Properties>
		<ChildObjects>
			<Form>${params.formName}</Form>
		</ChildObjects>
		<InternalInfo/>
	</Catalog>
</MetaDataObject>`

const formMetadataXml = (name: string): string => `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
	<Form uuid="22222222-2222-2222-2222-222222222222">
		<Properties>
			<Name>${name}</Name>
			<Synonym/>
			<Comment/>
			<FormType>Managed</FormType>
		</Properties>
	</Form>
</MetaDataObject>`

const commonFormMetadataXml = (name: string): string => `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
	<CommonForm uuid="33333333-3333-3333-3333-333333333333">
		<Properties>
			<Name>${name}</Name>
			<Synonym/>
			<Comment/>
			<UsePurposes>
				<v8:Value>PersonalComputer</v8:Value>
			</UsePurposes>
		</Properties>
	</CommonForm>
</MetaDataObject>`

const makeCatalogWithFormXmlProject = (): string => {
  const dir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-round-trip-yaml-fast-form-"))
  const catalogName = "СправочникФорма"
  const formName = "ФормаСписка"
  const formsDir = join(dir, "Catalogs", catalogName, "Forms")
  fs.mkdirSync(join(formsDir, formName, "Ext"), { recursive: true })
  fs.writeFileSync(join(dir, "Catalogs", `${catalogName}.xml`), catalogWithFormXml({ name: catalogName, formName }), "utf-8")
  fs.writeFileSync(join(formsDir, `${formName}.xml`), formMetadataXml(formName), "utf-8")
  fs.writeFileSync(
    join(formsDir, formName, "Ext", "Form.xml"),
    '<?xml version="1.0" encoding="UTF-8"?>\n<Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20"/>',
    "utf-8"
  )
  return dir
}

const makeCommonFormFilePathXmlProject = (): string => {
  const dir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-round-trip-yaml-fast-common-form-"))
  const formName = "ДинамическийСписок"
  fs.mkdirSync(join(dir, "CommonForms", formName, "Ext"), { recursive: true })
  fs.writeFileSync(join(dir, "CommonForms", `${formName}.xml`), commonFormMetadataXml(formName), "utf-8")
  fs.writeFileSync(join(dir, "CommonForms", formName, "Ext", "Form.xml"), "<broken>", "utf-8")
  return dir
}

describe("roundTripYAMLFast", () => {
  it("returns no diffs for stable metadata xml", async () => {
    const xmlDir = makeXmlProject(enumXml({ name: "ВидыСервисовЭДО", choiceMode: "BothWays" }))
    try {
      const result = await roundTripYAMLFast({ inputDir: xmlDir })

      expect(result.errors).toEqual([])
      expect(result.diffs).toEqual([])
      expect(result.checked).toBe(1)
    } finally {
      fs.rmSync(xmlDir, { recursive: true, force: true })
    }
  })

  it("reports a diff produced by yaml text round-trip", async () => {
    const xmlDir = makeXmlProject(enumXml({ name: "ВидыСервисовЭДО" }))
    try {
      const result = await roundTripYAMLFast({ inputDir: xmlDir })

      expect(result.errors).toEqual([])
      expect(result.diffs).toHaveLength(1)
      expect(result.diffs[0]?.file).toBe("Enums/ВидыСервисовЭДО.xml")
      expect(result.diffs[0]?.xmlFileAbs).toBe(join(xmlDir, "Enums", "ВидыСервисовЭДО.xml"))
      expect(result.diffs[0]?.diffText).toContain("--- Enums/ВидыСервисовЭДО.xml")
      expect(result.diffs[0]?.diffText).toContain("+++ Enums/ВидыСервисовЭДО.xml.fast")
    } finally {
      fs.rmSync(xmlDir, { recursive: true, force: true })
    }
  })

  it("keeps going and records per-file errors", async () => {
    const xmlDir = makeXmlProject("<MetaDataObject><Enum><Properties><Name>Bad</Name>")
    try {
      const result = await roundTripYAMLFast({ inputDir: xmlDir })

      expect(result.checked).toBe(1)
      expect(result.diffs).toEqual([])
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]?.file).toBe("Enums/ВидыСервисовЭДО.xml")
      expect(result.errors[0]?.message.length).toBeGreaterThan(0)
    } finally {
      fs.rmSync(xmlDir, { recursive: true, force: true })
    }
  })

  it("round-trips external data source file item child references without reading child files", async () => {
    const xmlDir = makeExternalDataSourceXmlProject(externalDataSourceXml({ name: "ВнешнийИсточникДанныхВсеСвойства" }))
    try {
      const result = await roundTripYAMLFast({ inputDir: xmlDir })

      expect(result.errors).toEqual([])
      expect(result.diffs).toEqual([])
      expect(result.checked).toBe(1)
    } finally {
      fs.rmSync(xmlDir, { recursive: true, force: true })
    }
  })

  it("checks form XML files discovered through import form files", async () => {
    const xmlDir = makeCatalogWithFormXmlProject()
    try {
      const result = await roundTripYAMLFast({ inputDir: xmlDir })

      expect(result.checked).toBe(2)
    } finally {
      fs.rmSync(xmlDir, { recursive: true, force: true })
    }
  })

  it("checks direct filePath XML for common forms", async () => {
    const xmlDir = makeCommonFormFilePathXmlProject()
    try {
      const result = await roundTripYAMLFast({ inputDir: xmlDir })

      expect(result.checked).toBeGreaterThan(1)
      expect(result.errors.map((error) => error.file)).toContain("CommonForms/ДинамическийСписок/Ext/Form.xml")
    } finally {
      fs.rmSync(xmlDir, { recursive: true, force: true })
    }
  })

  it("checks external data source file-item XML and nested form XML through childCollections", async () => {
    const xmlDir = makeExternalDataSourceFixtureProject()
    try {
      corruptFixtureFile(xmlDir, "ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаПоУмолчанию.xml")
      corruptFixtureFile(xmlDir, "ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Cubes/КубПоУмолчанию.xml")
      corruptFixtureFile(
        xmlDir,
        "ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства/DimensionTables/ТаблицаИзмеренияВсеСвойства.xml"
      )
      corruptFixtureFile(
        xmlDir,
        "ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаВсеСвойства/Forms/ФормаСписка/Ext/Form.xml"
      )
      corruptFixtureFile(
        xmlDir,
        "ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства/Forms/ФормаСписка/Ext/Form.xml"
      )

      const result = await roundTripYAMLFast({ inputDir: xmlDir })
      const files = [...result.diffs.map((diff) => diff.file), ...result.errors.map((error) => error.file)]

      expect(result.checked).toBeGreaterThan(1)
      expect(files).toContain("ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаПоУмолчанию.xml")
      expect(files).toContain("ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Cubes/КубПоУмолчанию.xml")
      expect(files).toContain(
        "ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства/DimensionTables/ТаблицаИзмеренияВсеСвойства.xml"
      )
      expect(files).toContain(
        "ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаВсеСвойства/Forms/ФормаСписка/Ext/Form.xml"
      )
      expect(files).toContain(
        "ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства/Forms/ФормаСписка/Ext/Form.xml"
      )
    } finally {
      fs.rmSync(xmlDir, { recursive: true, force: true })
    }
  })

  it("keeps external data source file-item InternalInfo owner names", async () => {
    const xmlDir = makeExternalDataSourceFixtureProject()
    try {
      const result = await roundTripYAMLFast({ inputDir: xmlDir })
      const files = [...result.diffs.map((diff) => diff.file), ...result.errors.map((error) => error.file)]

      expect(files).not.toContain(
        "ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаПоУмолчанию.xml"
      )
      expect(files).not.toContain(
        "ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Cubes/КубПоУмолчанию.xml"
      )
      expect(files).not.toContain(
        "ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства/DimensionTables/ТаблицаИзмеренияВсеСвойства.xml"
      )
    } finally {
      fs.rmSync(xmlDir, { recursive: true, force: true })
    }
  })

  it("uses nested owner context for external data source default form targets", async () => {
    const xmlDir = makeExternalDataSourceFixtureProject()
    try {
      const result = await roundTripYAMLFast({ inputDir: xmlDir })

      expect(result.errors.map((error) => ({ file: error.file, message: error.message }))).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            file: "ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаВсеСвойства.xml",
            message: expect.stringContaining('Неизвестный сегмент "Table"'),
          }),
          expect.objectContaining({
            file: "ExternalDataSources/ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства.xml",
            message: expect.stringContaining('Неизвестный сегмент "Cube"'),
          }),
        ])
      )
    } finally {
      fs.rmSync(xmlDir, { recursive: true, force: true })
    }
  })
})
