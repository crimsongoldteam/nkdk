import fs from "fs"
import os from "os"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { describe, expect, it, vi } from "vitest"
import { XmlSyncManifest } from "~/metadata/appliedObjects/configuration/migrations/xmlManifest"
import { convertAppliedObjectFromXML } from "~/metadata/orchestration/appliedObject/convertFromXML"
import { syncAppliedObjectToXML } from "~/metadata/orchestration/appliedObject/syncToXML"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { MetadataCommonFormRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

const name = "КонстантаВсеСвойства"

const formXmlWithEnglishOnlyAttributeTitle = `<?xml version="1.0" encoding="UTF-8"?>
<Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:dcssch="http://v8.1c.ru/8.1/data-composition-system/schema" xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise" xmlns:lf="http://v8.1c.ru/8.2/managed-application/logform" xmlns:style="http://v8.1c.ru/8.1/data/ui/style" xmlns:sys="http://v8.1c.ru/8.1/data/ui/fonts/system" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:web="http://v8.1c.ru/8.1/data/ui/colors/web" xmlns:win="http://v8.1c.ru/8.1/data/ui/colors/windows" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
	<WindowOpeningMode>LockOwnerWindow</WindowOpeningMode>
	<AutoCommandBar name="" id="-1"/>
	<ChildItems/>
	<Attributes>
		<Attribute name="ОценкаОтправлена" id="8">
			<Title>
				<v8:item>
					<v8:lang>en</v8:lang>
					<v8:content>Оценка отправлена</v8:content>
				</v8:item>
			</Title>
			<Type>
				<v8:Type>xs:boolean</v8:Type>
			</Type>
		</Attribute>
	</Attributes>
</Form>`

const formXmlWithPlannerNil = `<?xml version="1.0" encoding="UTF-8"?>
<Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:dcssch="http://v8.1c.ru/8.1/data-composition-system/schema" xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise" xmlns:lf="http://v8.1c.ru/8.2/managed-application/logform" xmlns:pl="http://v8.1c.ru/8.3/data/planner" xmlns:style="http://v8.1c.ru/8.1/data/ui/style" xmlns:sys="http://v8.1c.ru/8.1/data/ui/fonts/system" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:web="http://v8.1c.ru/8.1/data/ui/colors/web" xmlns:win="http://v8.1c.ru/8.1/data/ui/colors/windows" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
	<WindowOpeningMode>LockOwnerWindow</WindowOpeningMode>
	<AutoCommandBar name="" id="-1"/>
	<ChildItems/>
	<Attributes>
		<Attribute name="Канбан" id="1">
			<Title/>
			<Type>
				<v8:Type>cfg:Planner</v8:Type>
			</Type>
			<Settings xsi:type="pl:Planner">
				<pl:item>
					<pl:value xsi:nil="true"/>
					<pl:text>Встреча</pl:text>
				</pl:item>
			</Settings>
		</Attribute>
	</Attributes>
</Form>`

const createCommonFormTempFixture = async () => {
  const testDir = dirname(fileURLToPath(import.meta.url))
  const fixturesDir = join(testDir, "__fixtures__", "sync")
  const tmpDir = fs.mkdtempSync(join(os.tmpdir(), "common-form-module-"))
  const inputDir = join(tmpDir, "xml")
  const yamlDir = join(tmpDir, "yaml")
  const outputDir = join(tmpDir, "out")
  const moduleText = "Процедура ПриСозданииНаСервере(Отказ, СтандартнаяОбработка)\nКонецПроцедуры\n"

  await fs.promises.cp(join(fixturesDir, "xml"), inputDir, { recursive: true })
  await fs.promises.cp(join(fixturesDir, "yaml"), yamlDir, { recursive: true })
  await fs.promises.mkdir(join(inputDir, name, "Ext", "Form"), { recursive: true })
  await fs.promises.writeFile(join(inputDir, name, "Ext", "Form", "Module.bsl"), moduleText)
  await fs.promises.writeFile(join(yamlDir, name, "Модуль.bsl"), moduleText)

  return { inputDir, yamlDir, outputDir, moduleText }
}

describe("syncAppliedObjectToXML — MetadataCommonForm", () => {
  it("writes CommonForm XML and external form XML", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataCommonFormRules,
      name,
      importMetaUrl: import.meta.url,
      externalObjectDir: true,
      expectedFiles: ["КонстантаВсеСвойства.xml", "КонстантаВсеСвойства/Ext/Form.xml"],
    })
    for (const { path, result, expected } of comparisons) {
      expect(normalizeLineEndings(result), path).toBe(normalizeLineEndings(expected))
    }
  })

  it("enables ClientApplicationForm export after direct MetadataCommonFormRules import", async () => {
    vi.resetModules()

    const { clearTypeRulesRegistry, getTypeRule } = await import("~/metadata/orchestration/property/typeRuleRegistry")
    clearTypeRulesRegistry()
    expect(getTypeRule("ClientApplicationForm", "exportToXML")).toBeUndefined()

    const { MetadataCommonFormRules } = await import("./rules")
    const { createEmptyClientApplicationForm } = await import("~/metadata/forms/clientApplicationForm/createEmpty")
    const { exportPropertyToXML } = await import("~/metadata/orchestration/property/toXML")
    const { mockContextToXML } = await import("~/tests/mockContext")

    const exportToXML = getTypeRule("ClientApplicationForm", "exportToXML")
    expect(exportToXML).toBeTypeOf("function")

    const result = exportPropertyToXML({
      context: mockContextToXML(),
      rule: MetadataCommonFormRules.properties.form,
      value: createEmptyClientApplicationForm(),
    })

    expect(result).toMatchObject({
      Form: {
        _xmlns: "http://v8.1c.ru/8.3/xcf/logform",
      },
    })
  })

  it("copies common form Module.bsl from XML to YAML", async () => {
    const { inputDir, outputDir, moduleText } = await createCommonFormTempFixture()

    await convertAppliedObjectFromXML({
      rule: MetadataCommonFormRules,
      context: mockContextFromXML(),
      inputDir,
      name,
      outputDir,
    })

    expect(fs.readFileSync(join(outputDir, name, "Модуль.bsl"), "utf-8")).toBe(moduleText)
  })

  it("keeps common form Module.bsl during YAML to XML sync cleanup", async () => {
    const { inputDir, yamlDir, outputDir, moduleText } = await createCommonFormTempFixture()

    await syncAppliedObjectToXML({
      rule: MetadataCommonFormRules,
      context: mockContextToXML(),
      inputDir: yamlDir,
      name,
      outputDir,
      referenceDir: inputDir,
      externalOutputDir: join(outputDir, name),
      externalReferenceDir: join(inputDir, name),
    })

    expect(fs.readFileSync(join(outputDir, name, "Ext", "Form", "Module.bsl"), "utf-8")).toBe(moduleText)
  })

  it("copies common form Form.bin from XML to YAML", async () => {
    const { inputDir, outputDir } = await createCommonFormTempFixture()
    await fs.promises.writeFile(join(inputDir, name, "Ext", "Form.bin"), Buffer.from([0, 1, 2, 255]))

    await convertAppliedObjectFromXML({
      rule: MetadataCommonFormRules,
      context: mockContextFromXML(),
      inputDir,
      name,
      outputDir,
    })

    expect([...fs.readFileSync(join(outputDir, name, "Form.bin"))]).toEqual([0, 1, 2, 255])
  })

  it("restores common form Form.bin from YAML to XML and registers it in manifest", async () => {
    const { inputDir, yamlDir, outputDir } = await createCommonFormTempFixture()
    const xmlManifest = new XmlSyncManifest(outputDir)
    await fs.promises.writeFile(join(yamlDir, name, "Form.bin"), Buffer.from([0, 1, 2, 255]))

    await syncAppliedObjectToXML({
      rule: MetadataCommonFormRules,
      context: mockContextToXML(),
      inputDir: yamlDir,
      name,
      outputDir,
      referenceDir: inputDir,
      externalOutputDir: join(outputDir, name),
      externalReferenceDir: join(inputDir, name),
      xmlManifest,
    })

    expect([...fs.readFileSync(join(outputDir, name, "Ext", "Form.bin"))]).toEqual([0, 1, 2, 255])
    expect(xmlManifest.expectedFiles()).toContain(`${name}/Ext/Form.bin`)
  })

  it("copies common form HeaderPicture from XML to YAML", async () => {
    const { inputDir, outputDir } = await createCommonFormTempFixture()
    const picturePath = join(inputDir, name, "Ext", "Form", "Items", "ГруппаСШапкой", "HeaderPicture.png")
    await fs.promises.mkdir(dirname(picturePath), { recursive: true })
    await fs.promises.writeFile(picturePath, Buffer.from([7, 8, 9]))

    await convertAppliedObjectFromXML({
      rule: MetadataCommonFormRules,
      context: mockContextFromXML(),
      inputDir,
      name,
      outputDir,
    })

    expect([...fs.readFileSync(join(outputDir, name, "КартинкиШапки", "ГруппаСШапкой.png"))]).toEqual([7, 8, 9])
  })

  it("restores common form HeaderPicture from YAML to XML and registers it in manifest", async () => {
    const { inputDir, yamlDir, outputDir } = await createCommonFormTempFixture()
    const picturePath = join(yamlDir, name, "КартинкиШапки", "ГруппаСШапкой.png")
    const xmlManifest = new XmlSyncManifest(outputDir)
    await fs.promises.mkdir(dirname(picturePath), { recursive: true })
    await fs.promises.writeFile(picturePath, Buffer.from([7, 8, 9]))

    await syncAppliedObjectToXML({
      rule: MetadataCommonFormRules,
      context: mockContextToXML(),
      inputDir: yamlDir,
      name,
      outputDir,
      referenceDir: inputDir,
      externalOutputDir: join(outputDir, name),
      externalReferenceDir: join(inputDir, name),
      xmlManifest,
    })

    const outputPicturePath = join(outputDir, name, "Ext", "Form", "Items", "ГруппаСШапкой", "HeaderPicture.png")
    expect([...fs.readFileSync(outputPicturePath)]).toEqual([7, 8, 9])
    expect(xmlManifest.expectedFiles()).toContain(
      `${name}/Ext/Form/Items/ГруппаСШапкой/HeaderPicture.png`
    )
  })

  it("writes ManualQuery and QueryText for direct common form dynamic list", async () => {
    const { inputDir, yamlDir, outputDir } = await createCommonFormTempFixture()
    const queryText = "ВЫБРАТЬ\n\tСправочник1.Ссылка КАК Ссылка"
    await fs.promises.writeFile(
      join(yamlDir, name, "Свойства.yaml"),
      [
        "Форма:",
        "  Реквизиты:",
        "    Список:",
        "      Тип: ДинамическийСписок",
        "      ДинамическийСписок:",
        "        ПроизвольныйЗапрос: Истина",
        "        ДинамическоеСчитываниеДанных: Истина",
        "        ОсновнаяТаблица: Catalog.Справочник1",
        "",
      ].join("\n"),
      "utf-8"
    )
    await fs.promises.mkdir(join(yamlDir, name, "ДинамическийСписок"), { recursive: true })
    await fs.promises.writeFile(join(yamlDir, name, "ДинамическийСписок", "Список.query"), queryText, "utf-8")

    await syncAppliedObjectToXML({
      rule: MetadataCommonFormRules,
      context: {
        ...mockContextToXML(),
        importFromYAML: {
          formDir: join(yamlDir, name),
        },
      },
      inputDir: yamlDir,
      name,
      outputDir,
      referenceDir: inputDir,
      externalOutputDir: join(outputDir, name),
      externalReferenceDir: join(inputDir, name),
    })

    const formXml = fs.readFileSync(join(outputDir, name, "Ext", "Form.xml"), "utf-8")
    expect(formXml).toContain("<ManualQuery>true</ManualQuery>")
    expect(formXml).toContain("<QueryText>ВЫБРАТЬ")
  })

  it("keeps filePath reference languages during YAML import", async () => {
    const { inputDir, yamlDir, outputDir } = await createCommonFormTempFixture()
    await fs.promises.writeFile(
      join(yamlDir, name, "Свойства.yaml"),
      [
        "Форма:",
        "  Реквизиты:",
        "    ОценкаОтправлена:",
        "      Заголовок:",
        "        en: Оценка отправлена",
        "      Тип: Булево",
        "",
      ].join("\n"),
      "utf-8"
    )
    await fs.promises.writeFile(join(inputDir, name, "Ext", "Form.xml"), formXmlWithEnglishOnlyAttributeTitle, "utf-8")

    await syncAppliedObjectToXML({
      rule: MetadataCommonFormRules,
      context: mockContextToXML(),
      inputDir: yamlDir,
      name,
      outputDir,
      referenceDir: inputDir,
      externalOutputDir: join(outputDir, name),
      externalReferenceDir: join(inputDir, name),
    })

    const formXml = fs.readFileSync(join(outputDir, name, "Ext", "Form.xml"), "utf-8")
    const attributeXml = formXml.match(/<Attribute name="ОценкаОтправлена"[\s\S]*?<\/Attribute>/)?.[0]
    expect(attributeXml).toContain("<v8:lang>en</v8:lang>")
    expect(attributeXml).not.toContain("<v8:lang>ru</v8:lang>")
  })

  it("keeps filePath reference xsi:nil while exporting settings fragments", async () => {
    const { inputDir, yamlDir, outputDir } = await createCommonFormTempFixture()
    await fs.promises.writeFile(
      join(yamlDir, name, "Свойства.yaml"),
      [
        "Форма:",
        "  Реквизиты:",
        "    Канбан:",
        "      Заголовок: \"\"",
        "      Тип: Планировщик",
        "      Планировщик: |-",
        "        <pl:item>",
        "        \t<pl:value/>",
        "        \t<pl:text>Встреча</pl:text>",
        "        </pl:item>",
        "",
      ].join("\n"),
      "utf-8"
    )
    await fs.promises.writeFile(join(inputDir, name, "Ext", "Form.xml"), formXmlWithPlannerNil, "utf-8")

    await syncAppliedObjectToXML({
      rule: MetadataCommonFormRules,
      context: mockContextToXML(),
      inputDir: yamlDir,
      name,
      outputDir,
      referenceDir: inputDir,
      externalOutputDir: join(outputDir, name),
      externalReferenceDir: join(inputDir, name),
    })

    const formXml = fs.readFileSync(join(outputDir, name, "Ext", "Form.xml"), "utf-8")
    expect(formXml).toContain('<pl:value xsi:nil="true"/>')
  })
})
