import fs from "fs"
import { execFile } from "node:child_process"
import os from "os"
import { join } from "path"
import { promisify } from "util"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { mockContextFromXML } from "../../../tests/mockContext"
import { getXMLFixtureDir, readXMLFixtureAsString } from "../../../tests/readFixtureXML"
import { convertFormFromXML, readFormFromXML } from "./convertFromXML"
import { createConfigurationIndexCollector } from "../../configurationIndex/collector/writer"
import { withConfigurationIndexCollector } from "../../configurationIndex/collector/context"

const execFileAsync = promisify(execFile)

describe("import from XML string", () => {
  const inputDir = getXMLFixtureDir(import.meta.url, "sync/xml/Forms")
  const formName = "ФормаЭлемента"
  let outputDir: string

  beforeEach(() => {
    outputDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-form-convert-"))
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

  it("collects the form uuid under the owner-derived logical address", async () => {
    const collector = createConfigurationIndexCollector()

    await convertFormFromXML({
      context: withConfigurationIndexCollector(mockContextFromXML(), collector, "Справочник.Контрагенты"),
      inputDir,
      formName,
      outputDir,
    })

    expect(collector.fragment(`Справочник/Контрагенты/Формы/${formName}/Форма.yaml`).identities).toContainEqual(
      expect.objectContaining({
        logicalAddress: `Справочник.Контрагенты.Форма.${formName}`,
        kind: "uuid",
      })
    )
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
    expect(yaml).not.toContain("Синоним:")
    expect([...fs.readFileSync(join(formDir, "Form.bin"))]).toEqual([0, 1, 2, 255])
  })

  it("omits form synonym equal to the form name", async () => {
    const equalSynonymFormName = "ФормаСписка"
    const input = join(outputDir, "equal-synonym-input")
    fs.mkdirSync(input, { recursive: true })

    const metadataXML = `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
  <Form uuid="ff77d419-36ca-4447-95fe-9f60443c2455">
    <Properties>
      <Name>${equalSynonymFormName}</Name>
      <Synonym>
        <v8:item>
          <v8:lang>ru</v8:lang>
          <v8:content>Форма списка</v8:content>
        </v8:item>
      </Synonym>
      <Comment/>
      <FormType>Ordinary</FormType>
      <IncludeHelpInContents>false</IncludeHelpInContents>
    </Properties>
  </Form>
</MetaDataObject>`

    fs.writeFileSync(join(input, `${equalSynonymFormName}.xml`), metadataXML)

    await convertFormFromXML({
      context: mockContextFromXML(),
      inputDir: input,
      formName: equalSynonymFormName,
      outputDir,
    })

    const yaml = fs.readFileSync(join(outputDir, "Формы", equalSynonymFormName, "Форма.yaml"), "utf-8")
    expect(yaml).not.toContain("Синоним:")
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
    expect(yaml).not.toContain("Синоним:")
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
    const tmpRoot = fs.mkdtempSync(join(os.tmpdir(), "nkdk-form-help-files-"))
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
    const tmpRoot = fs.mkdtempSync(join(os.tmpdir(), "nkdk-form-item-pictures-"))
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

    expect(form.attributes).toEqual([
      {
        itemType: "FormAttribute",
        name: "Канбан",
        type: { type: ["Planner"] },
        title: { items: { ru: "" } },
        columns: [],
        planner: {
          "pl:item": {
            "pl:value": { "_xsi:nil": true },
            "pl:text": "Встреча",
          },
        },
      },
    ])
  })

  it("экспортирует событие BeforeExecute в YAML как ПередВыполнением", async () => {
    const eventFormName = "ФормаСобытияПередВыполнением"
    const input = join(outputDir, "event-input")
    const formExtDir = join(input, eventFormName, "Ext")
    fs.mkdirSync(formExtDir, { recursive: true })

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
  <Events>
    <Event name="OnOpen">ПриОткрытии</Event>
    <Event name="BeforeExecute">ПередВыполнением</Event>
  </Events>
</Form>`

    fs.writeFileSync(join(input, `${eventFormName}.xml`), managedFormMetadataXML(eventFormName))
    fs.writeFileSync(join(formExtDir, "Form.xml"), xml)

    await convertFormFromXML({
      context: mockContextFromXML(),
      inputDir: input,
      formName: eventFormName,
      outputDir,
    })

    const yaml = fs.readFileSync(join(outputDir, "Формы", eventFormName, "Форма.yaml"), "utf-8")

    expect(yaml).toContain("События:\n  ПередВыполнением: ПередВыполнением")
  })

  it("public core entrypoint exports form YAML rules", async () => {
    const script = `
      import assert from "node:assert/strict"
      import "./index"
      import { getTypeRule } from "./metadata/orchestration"

      assert.equal(typeof getTypeRule("ClientApplicationForm", "exportToYAML"), "function")
      assert.equal(typeof getTypeRule("GroupChildItems", "exportToYAML"), "function")
      assert.equal(typeof getTypeRule("TableChildItems", "exportToYAML"), "function")
      assert.equal(typeof getTypeRule("Events", "exportToYAML"), "function")
      assert.equal(typeof getTypeRule("FormCommands", "exportToYAML"), "function")
      assert.equal(typeof getTypeRule("TableAdditionalSource", "importFromXML"), "function")
    `

    await execFileAsync(process.execPath, ["--import", "tsx", "-e", script], {
      cwd: process.cwd(),
      encoding: "utf-8",
    })
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
