import fs from "fs"
import os from "os"
import { join } from "path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { XmlSyncManifest } from "../../appliedObjects/configuration/migrations/xmlManifest"
import { mockContextFromXML, mockContextToXML } from "../../../tests/mockContext"
import { getXMLFixtureDir, readXMLFixtureAsString } from "../../../tests/readFixtureXML"
import { convertFormFromXML } from "./convertFromXML"
import { prepareYamlFiles } from "../../project/prepareYamlFiles"
import { syncFormToXML, writePreparedFormToXML } from "./syncToXML"

describe("sync ClientApplicationForm to XML", () => {
  const inputDir = getXMLFixtureDir(import.meta.url, "sync/yaml")
  const referenceDir = getXMLFixtureDir(import.meta.url, "sync/xml/Forms")
  const formName = "ФормаЭлемента"
  let outputDir: string

  beforeEach(() => {
    outputDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-form-sync-"))
  })

  afterEach(() => {
    fs.rmSync(outputDir, { recursive: true, force: true })
  })

  it("читает форму из YAML и экспортирует XML", async () => {
    const tmpRoot = fs.mkdtempSync(join(os.tmpdir(), "nkdk-form-yaml-only-"))
    const tmpInputDir = join(tmpRoot, "yaml")

    try {
      fs.cpSync(inputDir, tmpInputDir, { recursive: true })

      await syncFormToXML({
        context: mockContextToXML(),
        inputDir: tmpInputDir,
        outputDir: outputDir,
        referenceDir: referenceDir,
        formName,
      })
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true })
    }

    const expectedFormXML = readXMLFixtureAsString(import.meta.url, join("sync/xml/Forms", formName, "Ext", "Form.xml"))
    const expectedMetadataXML = readXMLFixtureAsString(import.meta.url, join("sync/xml/Forms", "ФормаЭлемента.xml"))

    const resultFormXML = fs.readFileSync(join(outputDir, "Forms", formName, "Ext", "Form.xml"), "utf-8")
    const resultMetadataXML = fs.readFileSync(join(outputDir, "Forms", "ФормаЭлемента.xml"), "utf-8")

    expect(resultFormXML).toBe(expectedFormXML)
    expect(resultMetadataXML).toBe(expectedMetadataXML)
  })

  it("синхронизирует managed form без referenceDir", async () => {
    const tmpRoot = fs.mkdtempSync(join(os.tmpdir(), "nkdk-form-no-reference-"))
    const tmpInputDir = join(tmpRoot, "yaml")

    try {
      fs.cpSync(inputDir, tmpInputDir, { recursive: true })

      await syncFormToXML({
        context: mockContextToXML(),
        inputDir: tmpInputDir,
        outputDir,
        formName,
      })

      expect(fs.existsSync(join(outputDir, "Forms", `${formName}.xml`))).toBe(true)
      expect(fs.existsSync(join(outputDir, "Forms", formName, "Ext", "Form.xml"))).toBe(true)
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true })
    }
  })

  it("пишет managed form из подготовленного YAML без повторного чтения файла", async () => {
    const tmpRoot = fs.mkdtempSync(join(os.tmpdir(), "nkdk-form-prepared-"))
    const tmpInputDir = join(tmpRoot, "yaml")

    try {
      fs.cpSync(inputDir, tmpInputDir, { recursive: true })
      const projectPath = `Справочник/Товары/Формы/${formName}/Форма.yaml`
      const filePath = join(tmpInputDir, "Формы", formName, "Форма.yaml")
      const prepared = prepareYamlFiles({
        files: [
          {
            projectPath,
            filePath,
            role: "form",
            owner: { dir: "Справочник", name: "Товары" },
            itemType: "ClientApplicationForm",
          },
        ],
        itemTypeByYamlDir: { Справочник: "MetadataCatalog" },
      })
      fs.rmSync(filePath)

      await writePreparedFormToXML({
        context: mockContextToXML(),
        preparedYamlFile: prepared.yamlFiles[0]!,
        outputDir,
        formName,
      })

      expect(fs.existsSync(join(outputDir, "Forms", `${formName}.xml`))).toBe(true)
      expect(fs.existsSync(join(outputDir, "Forms", formName, "Ext", "Form.xml"))).toBe(true)
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true })
    }
  })

  it("синхронизирует managed form с пустым referenceDir как без reference", async () => {
    const tmpRoot = fs.mkdtempSync(join(os.tmpdir(), "nkdk-form-empty-reference-"))
    const tmpInputDir = join(tmpRoot, "yaml")
    const tmpReferenceDir = join(tmpRoot, "reference-forms")

    try {
      fs.cpSync(inputDir, tmpInputDir, { recursive: true })
      fs.mkdirSync(tmpReferenceDir, { recursive: true })

      await syncFormToXML({
        context: mockContextToXML(),
        inputDir: tmpInputDir,
        outputDir,
        referenceDir: tmpReferenceDir,
        formName,
      })

      expect(fs.existsSync(join(outputDir, "Forms", `${formName}.xml`))).toBe(true)
      expect(fs.existsSync(join(outputDir, "Forms", formName, "Ext", "Form.xml"))).toBe(true)
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true })
    }
  })

  it("отклоняет managed form без Ext/Form.xml", async () => {
    const tmpRoot = fs.mkdtempSync(join(os.tmpdir(), "nkdk-managed-form-without-body-"))
    const xmlInputDir = join(tmpRoot, "xml", "Forms")
    const managedFormName = "УправляемаяБезТела"

    try {
      fs.mkdirSync(xmlInputDir, { recursive: true })
      fs.writeFileSync(join(xmlInputDir, `${managedFormName}.xml`), managedFormMetadataXML(managedFormName))

      await expect(
        convertFormFromXML({
          context: mockContextFromXML(),
          inputDir: xmlInputDir,
          formName: managedFormName,
          outputDir: join(tmpRoot, "yaml"),
        })
      ).rejects.toThrow("Form.xml")
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true })
    }
  })

  it("сохраняет события и не пишет синоним, равный имени формы", async () => {
    const tmpRoot = fs.mkdtempSync(join(os.tmpdir(), "nkdk-form-events-roundtrip-"))
    const xmlInputDir = join(tmpRoot, "xml", "Forms")
    const yamlInputDir = join(tmpRoot, "yaml")
    const xmlOutputDir = join(tmpRoot, "out")
    const eventFormName = "ФормаСобытияПередВыполнением"
    const formExtDir = join(xmlInputDir, eventFormName, "Ext")

    try {
      fs.mkdirSync(formExtDir, { recursive: true })
      fs.writeFileSync(
        join(xmlInputDir, `${eventFormName}.xml`),
        managedFormMetadataXML(eventFormName, "Форма события перед выполнением")
      )
      fs.writeFileSync(
        join(formExtDir, "Form.xml"),
        [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">',
          "  <Events>",
          '    <Event name="OnOpen">ПриОткрытии</Event>',
          '    <Event name="BeforeExecute">ПередВыполнением</Event>',
          "  </Events>",
          "</Form>",
        ].join("\n")
      )

      await convertFormFromXML({
        context: mockContextFromXML(),
        inputDir: xmlInputDir,
        formName: eventFormName,
        outputDir: yamlInputDir,
      })

      const yaml = fs.readFileSync(join(yamlInputDir, "Формы", eventFormName, "Форма.yaml"), "utf-8")
      expect(yaml).toContain("ПередВыполнением: ПередВыполнением")
      expect(yaml).not.toContain("Синоним:")

      await syncFormToXML({
        context: mockContextToXML(),
        inputDir: yamlInputDir,
        outputDir: xmlOutputDir,
        referenceDir: xmlInputDir,
        formName: eventFormName,
      })

      expect(fs.readFileSync(join(xmlOutputDir, "Forms", eventFormName, "Ext", "Form.xml"), "utf-8")).toContain(
        '<Event name="BeforeExecute">ПередВыполнением</Event>'
      )
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true })
    }
  })

  it("передаёт currentXMLPath в экспорт формы и восстанавливает ERP AdditionalColumns", async () => {
    const tmpRoot = fs.mkdtempSync(join(os.tmpdir(), "nkdk-form-current-xml-path-"))
    const tmpInputDir = join(tmpRoot, "yaml")
    const tmpReferenceDir = join(tmpRoot, "reference-forms")
    const erpFormName = "ФормаСписка"

    try {
      fs.mkdirSync(join(tmpInputDir, "Формы", erpFormName), { recursive: true })
      fs.cpSync(referenceDir, tmpReferenceDir, { recursive: true })
      fs.copyFileSync(join(referenceDir, `${formName}.xml`), join(tmpReferenceDir, `${erpFormName}.xml`))
      fs.cpSync(join(referenceDir, formName), join(tmpReferenceDir, erpFormName), { recursive: true })
      fs.writeFileSync(
        join(tmpInputDir, "Формы", erpFormName, "Форма.yaml"),
        [
          "Реквизиты:",
          "  Объект:",
          "    Заголовок: ''",
          "    Тип: Строка",
          "    ДополнительныеКолонки:",
          "      Список.Способы:",
          "        Реквизит1:",
          "          Заголовок: Реквизит1",
          "          Тип: Строка",
          "Элементы:",
          "  ПолеВвода1:",
          "    Вид: ПолеВвода",
          "    ПутьКДанным: Объект",
          "",
        ].join("\n"),
        "utf-8"
      )

      await syncFormToXML({
        context: mockContextToXML(),
        inputDir: tmpInputDir,
        outputDir,
        referenceDir: tmpReferenceDir,
        formName: erpFormName,
        currentXMLPath: "Catalogs/СпособыОтраженияРасходовПоАмортизацииМСФО/Forms/ФормаСписка/Ext/Form.xml",
      })

      const resultFormXML = fs.readFileSync(join(outputDir, "Forms", erpFormName, "Ext", "Form.xml"), "utf-8")

      expect(resultFormXML.match(/<Column name="Реквизит1" id="[1-5]">/g)).toHaveLength(5)
      for (const id of ["1", "2", "3", "4", "5"]) {
        expect(resultFormXML).toContain(`<Column name="Реквизит1" id="${id}">`)
      }
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true })
    }
  })

  it("не накапливает состояние нумерации в родительском контексте между формами", async () => {
    const tmpRoot = fs.mkdtempSync(join(os.tmpdir(), "nkdk-form-numbering-"))
    const tmpInputDir = join(tmpRoot, "yaml")
    const tmpReferenceDir = join(tmpRoot, "reference-forms")
    const tmpOutputDir = join(tmpRoot, "out")
    const secondFormName = "ФормаВторая"

    try {
      fs.cpSync(inputDir, tmpInputDir, { recursive: true })
      fs.cpSync(referenceDir, tmpReferenceDir, { recursive: true })
      fs.cpSync(join(inputDir, "Формы", formName), join(tmpInputDir, "Формы", secondFormName), {
        recursive: true,
      })
      fs.cpSync(join(referenceDir, `${formName}.xml`), join(tmpReferenceDir, `${secondFormName}.xml`))
      fs.cpSync(join(referenceDir, formName), join(tmpReferenceDir, secondFormName), { recursive: true })

      const context = mockContextToXML()

      await syncFormToXML({
        context,
        inputDir: tmpInputDir,
        outputDir: tmpOutputDir,
        referenceDir: tmpReferenceDir,
        formName,
      })

      expect(fs.existsSync(join(tmpOutputDir, "Forms", formName, "Ext", "Form.xml"))).toBe(true)
      expect(context.exportToXML.context?.metadataForNumbering).toHaveLength(0)
      expect(context.exportToXML.context?.propertiesItemXmlStack).toBeUndefined()

      await syncFormToXML({
        context,
        inputDir: tmpInputDir,
        outputDir: tmpOutputDir,
        referenceDir: tmpReferenceDir,
        formName: secondFormName,
      })

      expect(fs.existsSync(join(tmpOutputDir, "Forms", secondFormName, "Ext", "Form.xml"))).toBe(true)
      expect(context.exportToXML.context?.metadataForNumbering).toHaveLength(0)
      expect(context.exportToXML.context?.propertiesItemXmlStack).toBeUndefined()
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true })
    }
  })

  it("восстанавливает внешние картинки элементов формы из YAML и добавляет их в manifest", async () => {
    const tmpRoot = fs.mkdtempSync(join(os.tmpdir(), "nkdk-form-item-pictures-to-xml-"))
    const tmpInputDir = join(tmpRoot, "yaml")
    const tmpReferenceDir = join(tmpRoot, "reference-forms")
    const xmlManifest = new XmlSyncManifest(outputDir)

    try {
      fs.cpSync(referenceDir, tmpReferenceDir, { recursive: true })
      const itemsDir = join(tmpReferenceDir, formName, "Ext", "Form", "Items")
      fs.mkdirSync(join(itemsDir, "Декорация2"), { recursive: true })
      fs.mkdirSync(join(itemsDir, "ГруппаСШапкой"), { recursive: true })
      fs.mkdirSync(join(itemsDir, "Статус"), { recursive: true })
      fs.mkdirSync(join(itemsDir, "ТаблицаСКартинкойСтрок"), { recursive: true })
      fs.writeFileSync(join(itemsDir, "Декорация2", "Picture.png"), Buffer.from([1, 2, 3]))
      fs.writeFileSync(join(itemsDir, "ГруппаСШапкой", "HeaderPicture.gif"), Buffer.from([7, 8, 9]))
      fs.writeFileSync(join(itemsDir, "Статус", "ValuesPicture.bmp"), Buffer.from([4, 5, 6]))
      fs.writeFileSync(join(itemsDir, "ТаблицаСКартинкойСтрок", "RowsPicture.png"), Buffer.from([11, 12, 13]))

      await convertFormFromXML({
        context: mockContextFromXML(),
        inputDir: tmpReferenceDir,
        formName,
        outputDir: tmpInputDir,
      })

      expect([...fs.readFileSync(join(tmpInputDir, "Формы", formName, "Картинки", "Декорация2.png"))]).toEqual([
        1, 2, 3,
      ])
      expect([...fs.readFileSync(join(tmpInputDir, "Формы", formName, "КартинкиШапки", "ГруппаСШапкой.gif"))]).toEqual([
        7, 8, 9,
      ])
      expect([...fs.readFileSync(join(tmpInputDir, "Формы", formName, "КартинкиЗначений", "Статус.bmp"))]).toEqual([
        4, 5, 6,
      ])
      expect([
        ...fs.readFileSync(join(tmpInputDir, "Формы", formName, "КартинкиСтрок", "ТаблицаСКартинкойСтрок.png")),
      ]).toEqual([11, 12, 13])

      await syncFormToXML({
        context: mockContextToXML(),
        inputDir: tmpInputDir,
        outputDir,
        referenceDir: tmpReferenceDir,
        formName,
        xmlManifest,
      })

      const picturePath = join(outputDir, "Forms", formName, "Ext", "Form", "Items", "Декорация2", "Picture.png")
      const valuesPicturePath = join(
        outputDir,
        "Forms",
        formName,
        "Ext",
        "Form",
        "Items",
        "Статус",
        "ValuesPicture.bmp"
      )
      const headerPicturePath = join(
        outputDir,
        "Forms",
        formName,
        "Ext",
        "Form",
        "Items",
        "ГруппаСШапкой",
        "HeaderPicture.gif"
      )
      const rowsPicturePath = join(
        outputDir,
        "Forms",
        formName,
        "Ext",
        "Form",
        "Items",
        "ТаблицаСКартинкойСтрок",
        "RowsPicture.png"
      )

      expect([...fs.readFileSync(picturePath)]).toEqual([1, 2, 3])
      expect([...fs.readFileSync(headerPicturePath)]).toEqual([7, 8, 9])
      expect([...fs.readFileSync(valuesPicturePath)]).toEqual([4, 5, 6])
      expect([...fs.readFileSync(rowsPicturePath)]).toEqual([11, 12, 13])
      expect(xmlManifest.expectedFiles()).toContain("Forms/ФормаЭлемента/Ext/Form/Items/Декорация2/Picture.png")
      expect(xmlManifest.expectedFiles()).toContain(
        "Forms/ФормаЭлемента/Ext/Form/Items/ГруппаСШапкой/HeaderPicture.gif"
      )
      expect(xmlManifest.expectedFiles()).toContain("Forms/ФормаЭлемента/Ext/Form/Items/Статус/ValuesPicture.bmp")
      expect(xmlManifest.expectedFiles()).toContain(
        "Forms/ФормаЭлемента/Ext/Form/Items/ТаблицаСКартинкойСтрок/RowsPicture.png"
      )
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true })
    }
  })

  it("восстанавливает Form.bin для managed form с Ext/Form.xml", async () => {
    const tmpRoot = fs.mkdtempSync(join(os.tmpdir(), "nkdk-managed-form-bin-to-xml-"))
    const tmpInputDir = join(tmpRoot, "yaml")
    const tmpReferenceDir = join(tmpRoot, "reference-forms")

    try {
      fs.cpSync(referenceDir, tmpReferenceDir, { recursive: true })
      fs.writeFileSync(join(tmpReferenceDir, formName, "Ext", "Form.bin"), Buffer.from([10, 20, 30]))

      await convertFormFromXML({
        context: mockContextFromXML(),
        inputDir: tmpReferenceDir,
        formName,
        outputDir: tmpInputDir,
      })

      expect([...fs.readFileSync(join(tmpInputDir, "Формы", formName, "Form.bin"))]).toEqual([10, 20, 30])

      await syncFormToXML({
        context: mockContextToXML(),
        inputDir: tmpInputDir,
        outputDir,
        referenceDir: tmpReferenceDir,
        formName,
      })

      expect([...fs.readFileSync(join(outputDir, "Forms", formName, "Ext", "Form.bin"))]).toEqual([10, 20, 30])
      expect(fs.existsSync(join(outputDir, "Forms", formName, "Ext", "Form.xml"))).toBe(true)
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true })
    }
  })

  it("восстанавливает form help _files recursively и добавляет их в manifest", async () => {
    const tmpRoot = fs.mkdtempSync(join(os.tmpdir(), "nkdk-form-help-files-to-xml-"))
    const tmpInputDir = join(tmpRoot, "yaml")
    const tmpReferenceDir = join(tmpRoot, "reference-forms")
    const xmlManifest = new XmlSyncManifest(outputDir)

    try {
      fs.cpSync(referenceDir, tmpReferenceDir, { recursive: true })
      fs.mkdirSync(join(tmpReferenceDir, formName, "Ext", "Help", "_files", "nested"), { recursive: true })
      fs.writeFileSync(join(tmpReferenceDir, formName, "Ext", "Help", "_files", "001.png"), Buffer.from([1, 2]))
      fs.writeFileSync(
        join(tmpReferenceDir, formName, "Ext", "Help", "_files", "nested", "002.png"),
        Buffer.from([3, 4])
      )

      await convertFormFromXML({
        context: mockContextFromXML(),
        inputDir: tmpReferenceDir,
        formName,
        outputDir: tmpInputDir,
      })

      expect([...fs.readFileSync(join(tmpInputDir, "Формы", formName, "Справка", "_files", "001.png"))]).toEqual([1, 2])
      expect([
        ...fs.readFileSync(join(tmpInputDir, "Формы", formName, "Справка", "_files", "nested", "002.png")),
      ]).toEqual([3, 4])

      await syncFormToXML({
        context: mockContextToXML(),
        inputDir: tmpInputDir,
        outputDir,
        referenceDir: tmpReferenceDir,
        formName,
        xmlManifest,
      })

      expect([...fs.readFileSync(join(outputDir, "Forms", formName, "Ext", "Help", "_files", "001.png"))]).toEqual([
        1, 2,
      ])
      expect([
        ...fs.readFileSync(join(outputDir, "Forms", formName, "Ext", "Help", "_files", "nested", "002.png")),
      ]).toEqual([3, 4])
      expect(xmlManifest.expectedFiles()).toContain(`Forms/${formName}/Ext/Help/_files/001.png`)
      expect(xmlManifest.expectedFiles()).toContain(`Forms/${formName}/Ext/Help/_files/nested/002.png`)
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true })
    }
  })

  it("восстанавливает ordinary form metadata и Form.bin без Ext/Form.xml", async () => {
    const ordinaryFormName = "ОбычнаяФорма"
    const tmpRoot = fs.mkdtempSync(join(os.tmpdir(), "nkdk-ordinary-form-bin-"))
    const xmlInputDir = join(tmpRoot, "xml", "Forms")
    const yamlInputDir = join(tmpRoot, "yaml")
    const formExtDir = join(xmlInputDir, ordinaryFormName, "Ext")

    try {
      fs.mkdirSync(formExtDir, { recursive: true })
      fs.writeFileSync(join(xmlInputDir, `${ordinaryFormName}.xml`), ordinaryFormMetadataXML(ordinaryFormName))
      fs.writeFileSync(join(formExtDir, "Form.bin"), Buffer.from([0, 1, 2, 255]))

      await convertFormFromXML({
        context: mockContextFromXML(),
        inputDir: xmlInputDir,
        formName: ordinaryFormName,
        outputDir: yamlInputDir,
      })

      await syncFormToXML({
        context: mockContextToXML(),
        inputDir: yamlInputDir,
        outputDir,
        referenceDir: xmlInputDir,
        formName: ordinaryFormName,
      })

      expect(fs.existsSync(join(outputDir, "Forms", ordinaryFormName, "Ext", "Form.xml"))).toBe(false)
      expect([...fs.readFileSync(join(outputDir, "Forms", ordinaryFormName, "Ext", "Form.bin"))]).toEqual([
        0, 1, 2, 255,
      ])
      expect(fs.readFileSync(join(outputDir, "Forms", `${ordinaryFormName}.xml`), "utf-8")).toContain(
        "<FormType>Ordinary</FormType>"
      )
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true })
    }
  })

  it("восстанавливает metadata-only ordinary form без каталога Ext", async () => {
    const ordinaryFormName = "ОбычнаяБезТела"
    const tmpRoot = fs.mkdtempSync(join(os.tmpdir(), "nkdk-ordinary-form-metadata-only-"))
    const xmlInputDir = join(tmpRoot, "xml", "Forms")
    const yamlInputDir = join(tmpRoot, "yaml")

    try {
      fs.mkdirSync(xmlInputDir, { recursive: true })
      fs.writeFileSync(join(xmlInputDir, `${ordinaryFormName}.xml`), ordinaryFormMetadataXML(ordinaryFormName))

      await convertFormFromXML({
        context: mockContextFromXML(),
        inputDir: xmlInputDir,
        formName: ordinaryFormName,
        outputDir: yamlInputDir,
      })

      await syncFormToXML({
        context: mockContextToXML(),
        inputDir: yamlInputDir,
        outputDir,
        referenceDir: xmlInputDir,
        formName: ordinaryFormName,
      })

      expect(fs.readFileSync(join(outputDir, "Forms", `${ordinaryFormName}.xml`), "utf-8")).toContain(
        "<FormType>Ordinary</FormType>"
      )
      expect(fs.existsSync(join(outputDir, "Forms", ordinaryFormName, "Ext"))).toBe(false)
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true })
    }
  })

  it("сохраняет Ext/Form.xml для ordinary form, если тело есть в reference", async () => {
    const ordinaryFormName = "ОбычнаяФормаСТелом"
    const tmpRoot = fs.mkdtempSync(join(os.tmpdir(), "nkdk-ordinary-form-xml-body-"))
    const xmlInputDir = join(tmpRoot, "xml", "Forms")
    const yamlInputDir = join(tmpRoot, "yaml")
    const formExtDir = join(xmlInputDir, ordinaryFormName, "Ext")

    try {
      fs.mkdirSync(formExtDir, { recursive: true })
      fs.writeFileSync(join(xmlInputDir, `${ordinaryFormName}.xml`), ordinaryFormMetadataXML(ordinaryFormName))
      const formXML = readXMLFixtureAsString(import.meta.url, "minimal.xml")
      fs.writeFileSync(join(formExtDir, "Form.xml"), formXML)

      await convertFormFromXML({
        context: mockContextFromXML(),
        inputDir: xmlInputDir,
        formName: ordinaryFormName,
        outputDir: yamlInputDir,
      })

      await syncFormToXML({
        context: mockContextToXML(),
        inputDir: yamlInputDir,
        outputDir,
        referenceDir: xmlInputDir,
        formName: ordinaryFormName,
      })

      expect(fs.readFileSync(join(outputDir, "Forms", ordinaryFormName, "Ext", "Form.xml"), "utf-8")).toBe(formXML)
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true })
    }
  })
})

const ordinaryFormMetadataXML = (formName: string): string => `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
	<Form uuid="ed103b94-8ed1-443a-a7ea-5a2eb7fc6fbc">
		<Properties>
			<Name>${formName}</Name>
			<Synonym>
				<v8:item>
					<v8:lang>ru</v8:lang>
					<v8:content>${formName}</v8:content>
				</v8:item>
			</Synonym>
			<Comment/>
			<FormType>Ordinary</FormType>
			<IncludeHelpInContents>false</IncludeHelpInContents>
		</Properties>
	</Form>
</MetaDataObject>`

const managedFormMetadataXML = (formName: string, synonym?: string): string => `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
	<Form uuid="aaaaaaaa-1111-4222-8333-bbbbbbbbbbbb">
		<Properties>
			<Name>${formName}</Name>
			${
        synonym !== undefined
          ? `<Synonym><v8:item><v8:lang>ru</v8:lang><v8:content>${synonym}</v8:content></v8:item></Synonym>`
          : "<Synonym/>"
      }
			<Comment/>
			<FormType>Managed</FormType>
			<IncludeHelpInContents>false</IncludeHelpInContents>
		</Properties>
	</Form>
</MetaDataObject>`

describe("round-trip: withDynamicList XML → YAML+bsl → XML", () => {
  const xmlFixturesDir = getXMLFixtureDir(import.meta.url, "sync/xml/Forms")
  const formName = "withDynamicList"
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-roundtrip-"))
    // Шаг 1: экспортируем XML → YAML+bsl (в tmp)
    await convertFormFromXML({
      context: mockContextFromXML(),
      inputDir: xmlFixturesDir,
      formName,
      outputDir: tmpDir,
    })
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true })
  })

  it("должен восстановить идентичный XML из YAML+bsl", async () => {
    const xmlOutDir = join(tmpDir, "xml-out")

    // Шаг 2: импортируем YAML+bsl → XML
    await syncFormToXML({
      context: mockContextToXML(),
      inputDir: tmpDir,
      referenceDir: xmlFixturesDir,
      formName,
      outputDir: xmlOutDir,
    })

    const expectedFormXML = readXMLFixtureAsString(import.meta.url, join("sync/xml/Forms", formName, "Ext", "Form.xml"))

    const resultFormXML = fs.readFileSync(join(xmlOutDir, "Forms", formName, "Ext", "Form.xml"), "utf-8")
    expect(resultFormXML).toBe(expectedFormXML)
  })
})
