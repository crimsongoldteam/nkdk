import fs from "fs"
import { execFileSync } from "node:child_process"
import os from "os"
import { join } from "path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { plannerSettingsWithNil } from "~/metadata/forms/commonObjects/formAttribute/__fixtures__/plannerSettingsWithNil"
import { mockContextFromXML } from "~/tests/mockContext"
import { getXMLFixtureDir, readXMLFixtureAsString } from "~/tests/readFixtureXML"
import { convertFormFromXML, readFormFromXML } from "./convertFromXML"

describe("import from XML string", () => {
  const inputDir = getXMLFixtureDir(import.meta.url, "sync/xml/Forms")
  const formName = "ФормаЭлемента"
  let outputDir: string

  beforeEach(() => {
    outputDir = fs.mkdtempSync(join(os.tmpdir(), "nakidka-form-convert-"))
  })

  afterEach(() => {
    fs.rmSync(outputDir, { recursive: true, force: true })
  })

  it("should read form from XML and export to YAML file in output dir", async () => {
    await convertFormFromXML({
      context: mockContextFromXML(),
      inputDir,
      formName,
      outputDir,
    })

    const expectedYaml = readXMLFixtureAsString(import.meta.url, join("sync/yaml/Формы", formName, "Форма.yaml"))

    const resultYaml = fs.readFileSync(join(outputDir, "Формы", formName, "Форма.yaml"), "utf-8")

    expect(resultYaml).toBe(expectedYaml)
  })

  it("должен экспортировать текст запроса DynamicList во внешний .query файл", async () => {
    const dynamicListFormName = "withDynamicList"
    const attributeName = "ПроизвольныйЗапросМинимум"
    const expectedQueryText =
      "ВЫБРАТЬ\n\tСправочник1.Ссылка КАК Ссылка,\n\tСправочник1.Наименование КАК Наименование,\n\tСправочник1.Код КАК Код\nИЗ\n\tСправочник.Справочник1 КАК Справочник1"

    await convertFormFromXML({
      context: mockContextFromXML(),
      inputDir,
      formName: dynamicListFormName,
      outputDir,
    })

    const formOutputPath = join(outputDir, "Формы", dynamicListFormName)
    const yaml = fs.readFileSync(join(formOutputPath, "Форма.yaml"), "utf-8")

    expect(yaml).not.toContain("ТекстЗапроса:")
    expect(yaml).toContain("ПроизвольныйЗапрос: Истина")

    const queryPath = join(formOutputPath, "ДинамическийСписок", `${attributeName}.query`)
    expect(fs.existsSync(queryPath)).toBe(true)
    expect(fs.readFileSync(queryPath, "utf-8")).toBe(expectedQueryText)
  })

  it("imports ordinary form metadata and copies Form.bin without Form.xml", async () => {
    const ordinaryFormName = "ОбычнаяФорма"
    const input = join(outputDir, "ordinary-input")
    const formExtDir = join(input, ordinaryFormName, "Ext")
    fs.mkdirSync(formExtDir, { recursive: true })

    const metadataXML = `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
  <Form uuid="ed103b94-8ed1-443a-a7ea-5a2eb7fc6fbc">
    <Properties>
      <Name>${ordinaryFormName}</Name>
      <Synonym>
        <v8:item>
          <v8:lang>ru</v8:lang>
          <v8:content>Обычная форма</v8:content>
        </v8:item>
      </Synonym>
      <Comment/>
      <FormType>Ordinary</FormType>
      <IncludeHelpInContents>false</IncludeHelpInContents>
    </Properties>
  </Form>
</MetaDataObject>`

    fs.writeFileSync(join(input, `${ordinaryFormName}.xml`), metadataXML)
    fs.writeFileSync(join(formExtDir, "Form.bin"), Buffer.from([0, 1, 2, 255]))

    await convertFormFromXML({
      context: mockContextFromXML(),
      inputDir: input,
      formName: ordinaryFormName,
      outputDir,
    })

    const formDir = join(outputDir, "Формы", ordinaryFormName)
    const yaml = fs.readFileSync(join(formDir, "Форма.yaml"), "utf-8")
    expect(yaml).toContain("Синоним: Обычная форма")
    expect([...fs.readFileSync(join(formDir, "Form.bin"))]).toEqual([0, 1, 2, 255])
  })

  it("imports metadata-only ordinary form without creating Form.bin", async () => {
    const ordinaryFormName = "ОбычнаяБезТела"
    const input = join(outputDir, "ordinary-metadata-only-input")
    fs.mkdirSync(input, { recursive: true })

    const metadataXML = `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
  <Form uuid="ff77d419-36ca-4447-95fe-9f60443c2455">
    <Properties>
      <Name>${ordinaryFormName}</Name>
      <Synonym>
        <v8:item>
          <v8:lang>ru</v8:lang>
          <v8:content>Обычная без тела</v8:content>
        </v8:item>
      </Synonym>
      <Comment/>
      <FormType>Ordinary</FormType>
      <IncludeHelpInContents>false</IncludeHelpInContents>
    </Properties>
  </Form>
</MetaDataObject>`

    fs.writeFileSync(join(input, `${ordinaryFormName}.xml`), metadataXML)

    await convertFormFromXML({
      context: mockContextFromXML(),
      inputDir: input,
      formName: ordinaryFormName,
      outputDir,
    })

    const formDir = join(outputDir, "Формы", ordinaryFormName)
    const yaml = fs.readFileSync(join(formDir, "Форма.yaml"), "utf-8")
    expect(yaml).toContain("Синоним: Обычная без тела")
    expect(fs.existsSync(join(formDir, "Form.bin"))).toBe(false)
  })

  it("keeps managed form without Form.xml as an input error", async () => {
    const managedFormName = "УправляемаяБезТела"
    const input = join(outputDir, "managed-without-body-input")
    fs.mkdirSync(input, { recursive: true })

    const metadataXML = `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
  <Form uuid="aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb">
    <Properties>
      <Name>${managedFormName}</Name>
      <Synonym/>
      <Comment/>
      <FormType>Managed</FormType>
    </Properties>
  </Form>
</MetaDataObject>`

    fs.writeFileSync(join(input, `${managedFormName}.xml`), metadataXML)

    await expect(
      convertFormFromXML({
        context: mockContextFromXML(),
        inputDir: input,
        formName: managedFormName,
        outputDir,
      })
    ).rejects.toThrow("Form.xml")
  })

  it("copies managed form Form.bin even when Form.xml exists", async () => {
    const managedFormName = "УправляемаяСБинарнымТелом"
    const input = join(outputDir, "managed-bin-input")
    const formExtDir = join(input, managedFormName, "Ext")
    fs.mkdirSync(formExtDir, { recursive: true })
    fs.writeFileSync(join(input, `${managedFormName}.xml`), managedFormMetadataXML(managedFormName))
    fs.writeFileSync(join(formExtDir, "Form.xml"), `<Form xmlns="http://v8.1c.ru/8.3/xcf/form" version="2.20"/>`)
    fs.writeFileSync(join(formExtDir, "Form.bin"), Buffer.from([10, 20, 30]))

    await convertFormFromXML({
      context: mockContextFromXML(),
      inputDir: input,
      formName: managedFormName,
      outputDir,
    })

    expect([...fs.readFileSync(join(outputDir, "Формы", managedFormName, "Form.bin"))]).toEqual([10, 20, 30])
  })

  it("copies form help _files recursively", async () => {
    const tmpRoot = fs.mkdtempSync(join(os.tmpdir(), "nakidka-form-help-files-"))
    const tmpInputDir = join(tmpRoot, "xml")

    try {
      fs.cpSync(inputDir, tmpInputDir, { recursive: true })
      fs.mkdirSync(join(tmpInputDir, formName, "Ext", "Help", "_files", "nested"), { recursive: true })
      fs.writeFileSync(join(tmpInputDir, formName, "Ext", "Help", "_files", "001.png"), Buffer.from([1, 2]))
      fs.writeFileSync(join(tmpInputDir, formName, "Ext", "Help", "_files", "nested", "002.png"), Buffer.from([3, 4]))

      await convertFormFromXML({
        context: mockContextFromXML(),
        inputDir: tmpInputDir,
        formName,
        outputDir,
      })

      expect([...fs.readFileSync(join(outputDir, "Формы", formName, "Справка", "_files", "001.png"))]).toEqual([1, 2])
      expect([
        ...fs.readFileSync(join(outputDir, "Формы", formName, "Справка", "_files", "nested", "002.png")),
      ]).toEqual([3, 4])
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true })
    }
  })

  it("копирует внешние картинки элементов формы в YAML-каталоги по имени элемента", async () => {
    const tmpRoot = fs.mkdtempSync(join(os.tmpdir(), "nakidka-form-item-pictures-"))
    const tmpInputDir = join(tmpRoot, "xml")

    try {
      fs.cpSync(inputDir, tmpInputDir, { recursive: true })
      fs.mkdirSync(join(tmpInputDir, formName, "Ext", "Form", "Items", "Декорация2"), { recursive: true })
      fs.mkdirSync(join(tmpInputDir, formName, "Ext", "Form", "Items", "ГруппаСШапкой"), { recursive: true })
      fs.mkdirSync(join(tmpInputDir, formName, "Ext", "Form", "Items", "Статус"), { recursive: true })
      fs.mkdirSync(join(tmpInputDir, formName, "Ext", "Form", "Items", "ТаблицаСКартинкойСтрок"), { recursive: true })
      fs.writeFileSync(
        join(tmpInputDir, formName, "Ext", "Form", "Items", "Декорация2", "Picture.png"),
        Buffer.from([1, 2, 3])
      )
      fs.writeFileSync(
        join(tmpInputDir, formName, "Ext", "Form", "Items", "ГруппаСШапкой", "HeaderPicture.gif"),
        Buffer.from([7, 8, 9])
      )
      fs.writeFileSync(
        join(tmpInputDir, formName, "Ext", "Form", "Items", "Статус", "ValuesPicture.bmp"),
        Buffer.from([4, 5, 6])
      )
      fs.writeFileSync(
        join(tmpInputDir, formName, "Ext", "Form", "Items", "ТаблицаСКартинкойСтрок", "RowsPicture.png"),
        Buffer.from([11, 12, 13])
      )

      await convertFormFromXML({
        context: mockContextFromXML(),
        inputDir: tmpInputDir,
        formName,
        outputDir,
      })

      expect([...fs.readFileSync(join(outputDir, "Формы", formName, "Картинки", "Декорация2.png"))]).toEqual([1, 2, 3])
      expect([...fs.readFileSync(join(outputDir, "Формы", formName, "КартинкиШапки", "ГруппаСШапкой.gif"))]).toEqual([
        7, 8, 9,
      ])
      expect([...fs.readFileSync(join(outputDir, "Формы", formName, "КартинкиЗначений", "Статус.bmp"))]).toEqual([
        4, 5, 6,
      ])
      expect([
        ...fs.readFileSync(join(outputDir, "Формы", formName, "КартинкиСтрок", "ТаблицаСКартинкойСтрок.png")),
      ]).toEqual([11, 12, 13])
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true })
    }
  })

  it("preserves xsi:nil in raw SettingsFragment when reading form XML", () => {
    const nilFormName = "plannerSettingsWithNil"
    const nilInputDir = join(outputDir, "input")
    const nilFormDir = join(nilInputDir, nilFormName, "Ext")
    fs.mkdirSync(nilFormDir, { recursive: true })

    const metadataXML = readXMLFixtureAsString(import.meta.url, "minimalMetadata.xml")
    const formXML = readXMLFixtureAsString(import.meta.url, "minimal.xml")
    const attributeXML = readXMLFixtureAsString(
      import.meta.url,
      "../../commonObjects/formAttribute/__fixtures__/plannerSettingsWithNil.xml"
    )

    fs.writeFileSync(join(nilInputDir, `${nilFormName}.xml`), metadataXML)
    fs.writeFileSync(
      join(nilFormDir, "Form.xml"),
      formXML.replace("<Attributes/>", `<Attributes>${attributeXML}</Attributes>`)
    )

    const form = readFormFromXML({
      context: mockContextFromXML(),
      inputDir: nilInputDir,
      formName: nilFormName,
    })

    expect(form.attributes).toEqual(plannerSettingsWithNil)
  })

  it("public core entrypoint exports child items through element YAML rules", async () => {
    const script = `
      import assert from "node:assert/strict"
      import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs"
      import { tmpdir } from "node:os"
      import { join } from "node:path"
      import "./index"
      import { convertFormFromXML } from "./metadata/forms/clientApplicationForm/convertFromXML"

      const metadataXML = \`<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
  <Form uuid="21a1cd6e-30f0-4f8a-9b2a-0e6f30a4f100">
    <Properties>
      <Name>ФормаСписка</Name>
      <Synonym>
        <v8:item>
          <v8:lang>ru</v8:lang>
          <v8:content>Форма списка</v8:content>
        </v8:item>
      </Synonym>
      <Comment/>
      <UsePurposes>PersonalComputer</UsePurposes>
    </Properties>
  </Form>
</MetaDataObject>\`

      const formXML = \`<?xml version="1.0" encoding="UTF-8"?>
<Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:dcssch="http://v8.1c.ru/8.1/data-composition-system/schema" xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise" xmlns:lf="http://v8.1c.ru/8.2/managed-application/logform" xmlns:style="http://v8.1c.ru/8.1/data/ui/style" xmlns:sys="http://v8.1c.ru/8.1/data/ui/fonts/system" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:web="http://v8.1c.ru/8.1/data/ui/colors/web" xmlns:win="http://v8.1c.ru/8.1/data/ui/colors/windows" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
  <ChildItems>
    <UsualGroup name="ГруппаБыстрыеОтборы" id="62">
      <Title>
        <v8:item>
          <v8:lang>ru</v8:lang>
          <v8:content>Быстрые отборы</v8:content>
        </v8:item>
      </Title>
      <Group>Horizontal</Group>
      <Behavior>Usual</Behavior>
      <Representation>None</Representation>
      <ShowTitle>false</ShowTitle>
      <ExtendedTooltip name="ГруппаБыстрыеОтборыExtendedTooltip" id="87"/>
    </UsualGroup>
  </ChildItems>
</Form>\`

      const projectDir = mkdtempSync(join(tmpdir(), "nakidka-form-yaml-public-"))
      const inputDir = join(projectDir, "input")
      const formExtDir = join(inputDir, "ФормаСписка", "Ext")
      const outputDir = join(projectDir, "output")

      try {
        mkdirSync(formExtDir, { recursive: true })
        writeFileSync(join(inputDir, "ФормаСписка.xml"), metadataXML, "utf-8")
        writeFileSync(join(formExtDir, "Form.xml"), formXML, "utf-8")

        await convertFormFromXML({
          context: {
            defaultLanguage: "ru",
            version: "2.20",
            exportToYAML: { toTyped: false },
            fromXML: { forReference: false },
          },
          inputDir,
          formName: "ФормаСписка",
          outputDir,
        })

        const yaml = readFileSync(join(outputDir, "Формы", "ФормаСписка", "Форма.yaml"), "utf-8")

        assert.match(yaml, /Элементы:\\n  ГруппаБыстрыеОтборы:/)
        assert.match(yaml, /Вид: Группа/)
        assert.match(yaml, /Заголовок: Быстрые отборы/)
        assert.doesNotMatch(yaml, /"#text"/)
        assert.doesNotMatch(yaml, /- UsualGroup:/)
      } finally {
        rmSync(projectDir, { recursive: true, force: true })
      }
    `

    expect(() =>
      execFileSync("node", ["--import", "tsx", "-e", script], { cwd: process.cwd(), encoding: "utf-8" })
    ).not.toThrow()
  }, 30000)

  it("public core entrypoint exports form common objects through YAML rules", async () => {
    const script = `
      import assert from "node:assert/strict"
      import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs"
      import { tmpdir } from "node:os"
      import { join } from "node:path"
      import "./index"
      import { convertFormFromXML } from "./metadata/forms/clientApplicationForm/convertFromXML"

      const metadataXML = \`<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
  <Form uuid="21a1cd6e-30f0-4f8a-9b2a-0e6f30a4f101">
    <Properties>
      <Name>ФормаСписка</Name>
      <Synonym>
        <v8:item>
          <v8:lang>ru</v8:lang>
          <v8:content>Форма списка</v8:content>
        </v8:item>
      </Synonym>
      <Comment/>
      <UsePurposes>PersonalComputer</UsePurposes>
    </Properties>
  </Form>
</MetaDataObject>\`

      const formXML = \`<?xml version="1.0" encoding="UTF-8"?>
<Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:dcssch="http://v8.1c.ru/8.1/data-composition-system/schema" xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise" xmlns:lf="http://v8.1c.ru/8.2/managed-application/logform" xmlns:style="http://v8.1c.ru/8.1/data/ui/style" xmlns:sys="http://v8.1c.ru/8.1/data/ui/fonts/system" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:web="http://v8.1c.ru/8.1/data/ui/colors/web" xmlns:win="http://v8.1c.ru/8.1/data/ui/colors/windows" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
  <Events>
    <Event name="NotificationProcessing">ОбработкаОповещения</Event>
    <Event name="OnCreateAtServer">ПриСозданииНаСервере</Event>
  </Events>
  <ChildItems>
    <Table name="Список" id="1">
      <Representation>List</Representation>
      <AutoCommandBar name="СписокКоманднаяПанель" id="2"/>
      <SearchStringAddition name="СписокСтрокаПоиска" id="3">
        <AdditionSource>
          <Item>Список</Item>
          <Type>SearchStringRepresentation</Type>
        </AdditionSource>
        <ContextMenu name="СписокСтрокаПоискаКонтекстноеМеню" id="4"/>
        <ExtendedTooltip name="СписокСтрокаПоискаРасширеннаяПодсказка" id="5"/>
      </SearchStringAddition>
      <Events>
        <Event name="Selection">СписокВыбор</Event>
      </Events>
    </Table>
  </ChildItems>
  <Commands>
    <Command name="ПереключитьАктивностьПроводок" id="10">
      <Title>
        <v8:item>
          <v8:lang>ru</v8:lang>
          <v8:content>Ручной заголовок команды</v8:content>
        </v8:item>
      </Title>
      <ToolTip>
        <v8:item>
          <v8:lang>ru</v8:lang>
          <v8:content>Подсказка команды</v8:content>
        </v8:item>
      </ToolTip>
      <Picture>
        <xr:Ref>StdPicture.SwitchActivity</xr:Ref>
        <xr:LoadTransparent>true</xr:LoadTransparent>
      </Picture>
      <Action>ПереключитьАктивностьПроводок</Action>
      <CurrentRowUse>DontUse</CurrentRowUse>
    </Command>
  </Commands>
</Form>\`

      const projectDir = mkdtempSync(join(tmpdir(), "nakidka-form-common-objects-public-"))
      const inputDir = join(projectDir, "input")
      const formExtDir = join(inputDir, "ФормаСписка", "Ext")
      const outputDir = join(projectDir, "output")

      try {
        mkdirSync(formExtDir, { recursive: true })
        writeFileSync(join(inputDir, "ФормаСписка.xml"), metadataXML, "utf-8")
        writeFileSync(join(formExtDir, "Form.xml"), formXML, "utf-8")

        await convertFormFromXML({
          context: {
            defaultLanguage: "ru",
            version: "2.20",
            exportToYAML: { toTyped: false },
            fromXML: { forReference: false },
          },
          inputDir,
          formName: "ФормаСписка",
          outputDir,
        })

        const yaml = readFileSync(join(outputDir, "Формы", "ФормаСписка", "Форма.yaml"), "utf-8")

        assert.match(yaml, /События:\\n  ОбработкаОповещения: ОбработкаОповещения\\n  ПриСозданииНаСервере: ПриСозданииНаСервере/)
        assert.match(yaml, /События:\\n      Выбор: СписокВыбор/)
        assert.match(yaml, /Команды:\\n  ПереключитьАктивностьПроводок:/)
        assert.match(yaml, /Заголовок: Ручной заголовок команды/)
        assert.match(yaml, /Подсказка: Подсказка команды/)
        assert.match(yaml, /Картинка: ПереключитьАктивность/)
        assert.match(yaml, /Действие: ПереключитьАктивностьПроводок/)
        assert.match(yaml, /ИспользованиеТекущейСтроки: НеИспользует/)
        assert.doesNotMatch(yaml, /"#text"/)
        assert.doesNotMatch(yaml, /Event:/)
        assert.doesNotMatch(yaml, /Command:/)
        assert.doesNotMatch(yaml, /AdditionSource:/)
        assert.doesNotMatch(yaml, /Title:/)
        assert.doesNotMatch(yaml, /ToolTip:/)
        assert.doesNotMatch(yaml, /Picture:/)
      } finally {
        rmSync(projectDir, { recursive: true, force: true })
      }
    `

    expect(() =>
      execFileSync("node", ["--import", "tsx", "-e", script], { cwd: process.cwd(), encoding: "utf-8" })
    ).not.toThrow()
  }, 30000)
})

const managedFormMetadataXML = (formName: string): string => `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
  <Form uuid="aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb">
    <Properties>
      <Name>${formName}</Name>
      <Synonym/>
      <Comment/>
      <FormType>Managed</FormType>
      <IncludeHelpInContents>false</IncludeHelpInContents>
    </Properties>
  </Form>
</MetaDataObject>`
