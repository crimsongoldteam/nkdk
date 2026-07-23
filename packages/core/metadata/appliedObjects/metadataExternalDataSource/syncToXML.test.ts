import { describe, expect, it } from "vitest"
import fs from "fs"
import os from "os"
import { join } from "path"
import { syncAppliedObjectToXML } from "../../orchestration/appliedObject/syncToXML"
import { testSyncAppliedObjectToXML } from "../../../tests/appliedObject"
import { mockContextToXML } from "../../../tests/mockContext"
import { buildChildFormCurrentXMLPath } from "../../commonObjects/childFormNames/syncExternalToXML"
import { createConfigDumpInfoExternalMetadataCollector } from "../configDumpInfo/externalMetadataCollector"
import { MetadataExternalDataSourceRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

const expectOrderedXMLTags = (xml: string, tags: string[]) => {
  let previousIndex = -1
  for (const tag of tags) {
    const index = xml.indexOf(tag)
    expect(index, tag).toBeGreaterThan(previousIndex)
    previousIndex = index
  }
}

const write = async (path: string, content: string) => {
  await fs.promises.mkdir(join(path, ".."), { recursive: true })
  await fs.promises.writeFile(path, content, "utf-8")
}

const minimalFormYAML = `Элементы:
  ПолеВвода1:
    Вид: ПолеВвода
    Ширина: 10
    ПутьКДанным: Реквизит
Синоним: Форма списка
НазначенияИспользования: ПлатформаИМобильноеПриложение`

describe("syncAppliedObjectToXML — MetadataExternalDataSource", () => {
  it("строит currentXMLPath формы вложенного file-item объекта без повторного имени объекта", () => {
    expect(
      buildChildFormCurrentXMLPath({
        xmlDir: "/tmp/out/Tables/ТаблицаА",
        name: "",
        formName: "ФормаСписка",
      })
    ).toBe("Tables/ТаблицаА/Forms/ФормаСписка/Ext/Form.xml")
  })

  it("читает ExternalDataSource из единого YAML-файла и записывает XML в outputDir", async () => {
    const { comparisons, outputDir } = await testSyncAppliedObjectToXML({
      rule: MetadataExternalDataSourceRules,
      name: "ВнешнийИсточникДанныхВсеСвойства",
      importMetaUrl: import.meta.url,
      externalObjectDir: true,
      expectedFiles: [
        "ВнешнийИсточникДанныхВсеСвойства.xml",
        "ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаВсеСвойства.xml",
        "ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаВсеСвойства/Ext/ManagerModule.bsl",
        "ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаВсеСвойства/Ext/ObjectModule.bsl",
        "ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаВсеСвойства/Ext/RecordSetModule.bsl",
        "ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаВсеСвойства/Ext/Help.xml",
        "ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаВсеСвойства/Ext/Help/ru.html",
        "ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаВсеСвойства/Forms/ФормаВыбора.xml",
        "ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаВсеСвойства/Forms/ФормаВыбора/Ext/Form.xml",
        "ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаВсеСвойства/Forms/ФормаОбъекта.xml",
        "ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаВсеСвойства/Forms/ФормаОбъекта/Ext/Form.xml",
        "ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаВсеСвойства/Forms/ФормаСписка.xml",
        "ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаВсеСвойства/Forms/ФормаСписка/Ext/Form.xml",
        "ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаВсеСвойства/Templates/Макет.xml",
        "ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаВсеСвойства/Templates/Макет/Ext/Template.txt",
        "ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаВсеСвойства/Commands/Команда1/Ext/CommandModule.bsl",
        "ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаПоУмолчанию.xml",
        "ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаПоУмолчанию/Ext/RecordSetModule.bsl",
        "ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаМодульНабора.xml",
        "ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаМодульНабора/Ext/RecordSetModule.bsl",
        "ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства.xml",
        "ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства/Ext/RecordSetModule.bsl",
        "ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства/Ext/Help.xml",
        "ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства/Ext/Help/ru.html",
        "ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства/Forms/ФормаЗаписи.xml",
        "ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства/Forms/ФормаЗаписи/Ext/Form.xml",
        "ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства/Forms/ФормаСписка.xml",
        "ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства/Forms/ФормаСписка/Ext/Form.xml",
        "ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства/Templates/Макет.xml",
        "ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства/Templates/Макет/Ext/Template.txt",
        "ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства/Commands/Команда1/Ext/CommandModule.bsl",
        "ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства/DimensionTables/ТаблицаИзмеренияВсеСвойства.xml",
        "ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства/DimensionTables/ТаблицаИзмеренияВсеСвойства/Ext/ManagerModule.bsl",
        "ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства/DimensionTables/ТаблицаИзмеренияПоУмолчанию.xml",
        "ВнешнийИсточникДанныхВсеСвойства/Cubes/КубПоУмолчанию.xml",
      ],
    })

    for (const { path, result, expected } of comparisons) {
      expect(normalizeLineEndings(result), path).toBe(normalizeLineEndings(expected))
    }

    expect(
      fs.existsSync(
        join(
          outputDir,
          "ВнешнийИсточникДанныхВсеСвойства",
          "Tables",
          "ТаблицаВсеСвойства",
          "Tables",
          "ТаблицаВсеСвойства"
        )
      )
    ).toBe(false)
  })

  it("синхронизирует внешние Module/Help дочерних таблиц, кубов и таблиц измерений", async () => {
    const rootDir = await fs.promises.mkdtemp(join(os.tmpdir(), "eds-sync-children-"))
    const inputDir = join(rootDir, "yaml")
    const outputDir = join(rootDir, "out")
    const referenceDir = join(import.meta.dirname, "__fixtures__/sync/xml")
    const objectDir = join(inputDir, "ВнешнийИсточникДанныхВсеСвойства")

    await write(
      join(objectDir, "Свойства.yaml"),
      `Синоним: Синоним
Таблицы:
  ТаблицаВсеСвойства:
    ИмяВИсточникеДанных: ИмяВИсточнике
    Команды:
      Команда1:
        Группа: ПанельНавигацииФормыПерейти
Кубы:
  КубВсеСвойства:
    ИмяВИсточникеДанных: ИмяВИсточнике
    ТаблицыИзмерений:
      ТаблицаИзмеренияВсеСвойства:
        ИмяВИсточникеДанных: Имя в источнике данных`
    )
    await write(join(objectDir, "Таблицы/ТаблицаВсеСвойства/МодульМенеджера.bsl"), "// table manager")
    await write(join(objectDir, "Таблицы/ТаблицаВсеСвойства/Команды/Команда1.bsl"), "// table command")
    await write(join(objectDir, "Таблицы/ТаблицаВсеСвойства/Справка/ru.html"), "<html>table help</html>")
    await write(join(objectDir, "Кубы/КубВсеСвойства/МодульНабораЗаписей.bsl"), "// cube record set")
    await write(join(objectDir, "Кубы/КубВсеСвойства/Справка/ru.html"), "<html>cube help</html>")
    await write(
      join(objectDir, "Кубы/КубВсеСвойства/ТаблицыИзмерений/ТаблицаИзмеренияВсеСвойства/МодульМенеджера.bsl"),
      "// dimension table manager"
    )
    await write(
      join(objectDir, "Кубы/КубВсеСвойства/ТаблицыИзмерений/ТаблицаИзмеренияВсеСвойства/Справка/ru.html"),
      "<html>dimension table help</html>"
    )

    await syncAppliedObjectToXML({
      rule: MetadataExternalDataSourceRules,
      context: mockContextToXML(),
      inputDir,
      name: "ВнешнийИсточникДанныхВсеСвойства",
      outputDir,
      referenceDir,
    })

    expect(fs.readFileSync(join(outputDir, "Tables/ТаблицаВсеСвойства/Ext/ManagerModule.bsl"), "utf-8")).toBe(
      "// table manager"
    )
    expect(
      fs.readFileSync(join(outputDir, "Tables/ТаблицаВсеСвойства/Commands/Команда1/Ext/CommandModule.bsl"), "utf-8")
    ).toBe("// table command")
    expect(fs.existsSync(join(outputDir, "Tables/ТаблицаВсеСвойства/Tables/ТаблицаВсеСвойства"))).toBe(false)
    expect(fs.readFileSync(join(outputDir, "Tables/ТаблицаВсеСвойства/Ext/Help/ru.html"), "utf-8")).toBe(
      "<html>table help</html>"
    )
    expect(fs.readFileSync(join(outputDir, "Cubes/КубВсеСвойства/Ext/RecordSetModule.bsl"), "utf-8")).toBe(
      "// cube record set"
    )
    expect(fs.readFileSync(join(outputDir, "Cubes/КубВсеСвойства/Ext/Help/ru.html"), "utf-8")).toBe(
      "<html>cube help</html>"
    )
    expect(
      fs.readFileSync(
        join(outputDir, "Cubes/КубВсеСвойства/DimensionTables/ТаблицаИзмеренияВсеСвойства/Ext/ManagerModule.bsl"),
        "utf-8"
      )
    ).toBe("// dimension table manager")
    expect(
      fs.readFileSync(
        join(outputDir, "Cubes/КубВсеСвойства/DimensionTables/ТаблицаИзмеренияВсеСвойства/Ext/Help/ru.html"),
        "utf-8"
      )
    ).toBe("<html>dimension table help</html>")
  })

  it("пишет локальную форму inline таблицы измерений как member текущего владельца", async () => {
    const rootDir = await fs.promises.mkdtemp(join(os.tmpdir(), "eds-sync-inline-dimension-form-"))
    const inputDir = join(rootDir, "yaml")
    const outputDir = join(rootDir, "out")
    const objectDir = join(inputDir, "ВнешнийИсточник")

    await write(
      join(objectDir, "Свойства.yaml"),
      `Синоним: Синоним
Кубы:
  Куб:
    ИмяВИсточникеДанных: КубSQL
    ТаблицыИзмерений:
      Измерение:
        ИмяВИсточникеДанных: ИзмерениеSQL
        ОсновнаяФормаСписка: ФормаСписка`
    )
    await write(join(objectDir, "Кубы/Куб/ТаблицыИзмерений/Измерение/Формы/ФормаСписка/Форма.yaml"), minimalFormYAML)

    await syncAppliedObjectToXML({
      rule: MetadataExternalDataSourceRules,
      context: mockContextToXML(),
      inputDir,
      name: "ВнешнийИсточник",
      outputDir,
      useReferenceXML: false,
    })

    const dimensionTableXml = fs.readFileSync(join(outputDir, "Cubes/Куб/DimensionTables/Измерение.xml"), "utf-8")
    expect(dimensionTableXml).toContain(
      "<DefaultListForm>ExternalDataSource.ВнешнийИсточник.Cube.Куб.DimensionTable.Измерение.Form.ФормаСписка</DefaultListForm>"
    )
    expect(fs.existsSync(join(outputDir, "Cubes/Куб/DimensionTables/Измерение/Forms/ФормаСписка.xml"))).toBe(true)
  })

  it("без reference собирает таблицы, кубы и таблицы измерений из отдельных YAML-папок", async () => {
    const rootDir = await fs.promises.mkdtemp(join(os.tmpdir(), "eds-sync-folder-children-"))
    const inputDir = join(rootDir, "yaml")
    const outputDir = join(rootDir, "out")
    const objectDir = join(inputDir, "ВнешнийИсточник")

    await write(join(objectDir, "Свойства.yaml"), "Синоним: Синоним")
    await write(join(objectDir, "Таблицы/ЯТаблица/Свойства.yaml"), "ИмяВИсточникеДанных: ЯТаблицаSQL")
    await write(join(objectDir, "Таблицы/АТаблица/Свойства.yaml"), "ИмяВИсточникеДанных: АТаблицаSQL")
    await write(
      join(objectDir, "Таблицы/АТаблица/Формы/ФормаСписка/Форма.yaml"),
      `Элементы:
  ПолеВвода1:
    Вид: ПолеВвода
    Ширина: 10
    ПутьКДанным: Реквизит
Синоним: Форма списка
НазначенияИспользования: ПлатформаИМобильноеПриложение`
    )
    await write(join(objectDir, "Кубы/ЯКуб/Свойства.yaml"), "ИмяВИсточникеДанных: ЯКубSQL")
    await write(join(objectDir, "Кубы/АКуб/Свойства.yaml"), "ИмяВИсточникеДанных: АКубSQL")
    await write(
      join(objectDir, "Кубы/АКуб/ТаблицыИзмерений/ЯИзмерение/Свойства.yaml"),
      "ИмяВИсточникеДанных: ЯИзмерениеSQL"
    )
    await write(
      join(objectDir, "Кубы/АКуб/ТаблицыИзмерений/АИзмерение/Свойства.yaml"),
      `ИмяВИсточникеДанных: АИзмерениеSQL
ОсновнаяФормаСписка: ФормаСписка`
    )
    await write(join(objectDir, "Кубы/АКуб/ТаблицыИзмерений/АИзмерение/Формы/ФормаСписка/Форма.yaml"), minimalFormYAML)

    await syncAppliedObjectToXML({
      rule: MetadataExternalDataSourceRules,
      context: mockContextToXML(),
      inputDir,
      name: "ВнешнийИсточник",
      outputDir,
      useReferenceXML: false,
    })

    const rootXml = fs.readFileSync(join(outputDir, "ВнешнийИсточник.xml"), "utf-8")
    expect(rootXml).toContain("<Table>АТаблица</Table>")
    expect(rootXml).toContain("<Table>ЯТаблица</Table>")
    expect(rootXml).toContain("<Cube>АКуб</Cube>")
    expect(rootXml).toContain("<Cube>ЯКуб</Cube>")
    expect(rootXml.indexOf("<Table>АТаблица</Table>")).toBeLessThan(rootXml.indexOf("<Table>ЯТаблица</Table>"))
    expect(rootXml.indexOf("<Cube>АКуб</Cube>")).toBeLessThan(rootXml.indexOf("<Cube>ЯКуб</Cube>"))

    const cubeXml = fs.readFileSync(join(outputDir, "Cubes/АКуб.xml"), "utf-8")
    expect(cubeXml).toContain("<DimensionTable>АИзмерение</DimensionTable>")
    expect(cubeXml).toContain("<DimensionTable>ЯИзмерение</DimensionTable>")
    expect(cubeXml.indexOf("<DimensionTable>АИзмерение</DimensionTable>")).toBeLessThan(
      cubeXml.indexOf("<DimensionTable>ЯИзмерение</DimensionTable>")
    )

    expect(fs.existsSync(join(outputDir, "Tables/АТаблица.xml"))).toBe(true)
    expect(fs.existsSync(join(outputDir, "Tables/АТаблица/Forms/ФормаСписка.xml"))).toBe(true)
    expect(fs.existsSync(join(outputDir, "Tables/АТаблица/Forms/ФормаСписка/Ext/Form.xml"))).toBe(true)
    expect(fs.existsSync(join(outputDir, "Tables/ЯТаблица.xml"))).toBe(true)
    expect(fs.existsSync(join(outputDir, "Cubes/АКуб.xml"))).toBe(true)
    expect(fs.existsSync(join(outputDir, "Cubes/ЯКуб.xml"))).toBe(true)
    expect(fs.existsSync(join(outputDir, "Cubes/АКуб/DimensionTables/АИзмерение.xml"))).toBe(true)
    expect(fs.existsSync(join(outputDir, "Cubes/АКуб/DimensionTables/ЯИзмерение.xml"))).toBe(true)
    const dimensionTableXml = fs.readFileSync(join(outputDir, "Cubes/АКуб/DimensionTables/АИзмерение.xml"), "utf-8")
    expect(dimensionTableXml).toContain(
      "<DefaultListForm>ExternalDataSource.ВнешнийИсточник.Cube.АКуб.DimensionTable.АИзмерение.Form.ФормаСписка</DefaultListForm>"
    )
    expect(fs.existsSync(join(outputDir, "Cubes/АКуб/DimensionTables/АИзмерение/Forms/ФормаСписка.xml"))).toBe(true)
  })

  it("собирает ConfigDumpInfo-пути форм вложенных таблиц через владельца таблицы", async () => {
    const rootDir = await fs.promises.mkdtemp(join(os.tmpdir(), "eds-sync-configdumpinfo-table-form-"))
    const inputDir = join(rootDir, "yaml")
    const outputDir = join(rootDir, "out")
    const objectDir = join(inputDir, "ВнешнийИсточник")
    const context = mockContextToXML()
    context.exportToXML.itemsTree.push({
      itemType: "MetadataExternalDataSource",
      name: "ВнешнийИсточник",
      path: "MetadataExternalDataSource.ВнешнийИсточник",
      externalMetadata: { segment: "ExternalDataSource", placement: "rootEntry" },
    })
    ;(
      context.exportToXML as typeof context.exportToXML & {
        externalMetadataCollector: ReturnType<typeof createConfigDumpInfoExternalMetadataCollector>
      }
    ).externalMetadataCollector = createConfigDumpInfoExternalMetadataCollector(context.exportToXML.configDumpInfo)

    await write(join(objectDir, "Свойства.yaml"), "Синоним: Синоним")
    await write(
      join(objectDir, "Таблицы/АТаблица/Свойства.yaml"),
      `ИмяВИсточникеДанных: АТаблицаSQL
ОсновнаяФормаСписка: ФормаСписка`
    )
    await write(join(objectDir, "Таблицы/АТаблица/Формы/ФормаСписка/Форма.yaml"), minimalFormYAML)

    await syncAppliedObjectToXML({
      rule: MetadataExternalDataSourceRules,
      context,
      inputDir,
      name: "ВнешнийИсточник",
      outputDir,
      useReferenceXML: false,
    })

    const names = [...context.exportToXML.configDumpInfo.keys()]
    expect(names).toContain("ExternalDataSource.ВнешнийИсточник.Table.АТаблица.Form.ФормаСписка")
    expect(names).toContain("ExternalDataSource.ВнешнийИсточник.Table.АТаблица.Form.ФормаСписка.Form")
    expect(names).not.toContain("ExternalDataSource.ВнешнийИсточник.Form.ФормаСписка")
    expect(names).not.toContain("ExternalDataSource.ВнешнийИсточник.Form.ФормаСписка.Form")
  })

  it("папки с YAML имеют приоритет над старым inline-описанием дочерних объектов", async () => {
    const rootDir = await fs.promises.mkdtemp(join(os.tmpdir(), "eds-sync-folder-priority-"))
    const inputDir = join(rootDir, "yaml")
    const outputDir = join(rootDir, "out")
    const objectDir = join(inputDir, "ВнешнийИсточник")

    await write(
      join(objectDir, "Свойства.yaml"),
      `Синоним: Синоним
Таблицы:
  InlineTable:
    ИмяВИсточникеДанных: InlineSQL
Кубы:
  InlineCube:
    ИмяВИсточникеДанных: InlineCubeSQL`
    )
    await write(join(objectDir, "Таблицы/FolderTable/Свойства.yaml"), "ИмяВИсточникеДанных: FolderSQL")
    await write(join(objectDir, "Кубы/FolderCube/Свойства.yaml"), "ИмяВИсточникеДанных: FolderCubeSQL")

    await syncAppliedObjectToXML({
      rule: MetadataExternalDataSourceRules,
      context: mockContextToXML(),
      inputDir,
      name: "ВнешнийИсточник",
      outputDir,
      useReferenceXML: false,
    })

    const rootXml = fs.readFileSync(join(outputDir, "ВнешнийИсточник.xml"), "utf-8")
    expect(rootXml).toContain("<Table>FolderTable</Table>")
    expect(rootXml).toContain("<Cube>FolderCube</Cube>")
    expect(rootXml).not.toContain("InlineTable")
    expect(rootXml).not.toContain("InlineCube")
    expect(fs.existsSync(join(outputDir, "Tables/FolderTable.xml"))).toBe(true)
    expect(fs.existsSync(join(outputDir, "Tables/InlineTable.xml"))).toBe(false)
  })

  it("сохраняет reference-порядок вложенных таблиц измерений из XML куба", async () => {
    const rootDir = await fs.promises.mkdtemp(join(os.tmpdir(), "eds-sync-dimension-order-"))
    const inputDir = join(rootDir, "yaml")
    const outputDir = join(rootDir, "out")
    const referenceDir = join(rootDir, "reference")
    const objectDir = join(inputDir, "ВнешнийИсточник")

    await write(join(objectDir, "Свойства.yaml"), "Синоним: Синоним")
    await write(join(objectDir, "Кубы/Куб/Свойства.yaml"), "ИмяВИсточникеДанных: КубSQL")
    await write(
      join(objectDir, "Кубы/Куб/ТаблицыИзмерений/ТаблицаИзмеренияА/Свойства.yaml"),
      "ИмяВИсточникеДанных: ТаблицаИзмеренияАSQL"
    )
    await write(
      join(objectDir, "Кубы/Куб/ТаблицыИзмерений/ТаблицаИзмеренияБ/Свойства.yaml"),
      "ИмяВИсточникеДанных: ТаблицаИзмеренияБSQL"
    )
    await write(
      join(referenceDir, "Cubes/Куб.xml"),
      `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject>
  <Cube>
    <ChildObjects>
      <DimensionTable>ТаблицаИзмеренияБ</DimensionTable>
      <DimensionTable>ТаблицаИзмеренияА</DimensionTable>
    </ChildObjects>
  </Cube>
</MetaDataObject>`
    )

    await syncAppliedObjectToXML({
      rule: MetadataExternalDataSourceRules,
      context: mockContextToXML(),
      inputDir,
      name: "ВнешнийИсточник",
      outputDir,
      referenceDir,
      useReferenceXML: false,
    })

    const cubeXml = fs.readFileSync(join(outputDir, "Cubes/Куб.xml"), "utf-8")
    expect(cubeXml).toContain("<DimensionTable>ТаблицаИзмеренияБ</DimensionTable>")
    expect(cubeXml).toContain("<DimensionTable>ТаблицаИзмеренияА</DimensionTable>")
    expect(cubeXml.indexOf("<DimensionTable>ТаблицаИзмеренияБ</DimensionTable>")).toBeLessThan(
      cubeXml.indexOf("<DimensionTable>ТаблицаИзмеренияА</DimensionTable>")
    )
  })

  it("сохраняет reference-порядок таблиц из корневого XML при external reference-папке", async () => {
    const rootDir = await fs.promises.mkdtemp(join(os.tmpdir(), "eds-sync-root-order-"))
    const inputDir = join(rootDir, "yaml")
    const outputDir = join(rootDir, "out")
    const referenceDir = join(rootDir, "reference")
    const externalReferenceDir = join(referenceDir, "ВнешнийИсточник")
    const objectDir = join(inputDir, "ВнешнийИсточник")

    await write(join(objectDir, "Свойства.yaml"), "Синоним: Синоним")
    await write(join(objectDir, "Таблицы/ТаблицаВсеСвойства/Свойства.yaml"), "ИмяВИсточникеДанных: ВсеСвойстваSQL")
    await write(join(objectDir, "Таблицы/ТаблицаПоУмолчанию/Свойства.yaml"), "ИмяВИсточникеДанных: ПоУмолчаниюSQL")
    await write(join(objectDir, "Таблицы/ТаблицаМодульНабора/Свойства.yaml"), "ИмяВИсточникеДанных: МодульНабораSQL")
    await write(
      join(referenceDir, "ВнешнийИсточник.xml"),
      `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject>
  <ExternalDataSource>
    <ChildObjects>
      <Table>ТаблицаВсеСвойства</Table>
      <Table>ТаблицаПоУмолчанию</Table>
      <Table>ТаблицаМодульНабора</Table>
    </ChildObjects>
  </ExternalDataSource>
</MetaDataObject>`
    )
    await fs.promises.mkdir(externalReferenceDir, { recursive: true })

    await syncAppliedObjectToXML({
      rule: MetadataExternalDataSourceRules,
      context: mockContextToXML(),
      inputDir,
      name: "ВнешнийИсточник",
      outputDir,
      referenceDir,
      externalReferenceDir,
    })

    expectOrderedXMLTags(fs.readFileSync(join(outputDir, "ВнешнийИсточник.xml"), "utf-8"), [
      "<Table>ТаблицаВсеСвойства</Table>",
      "<Table>ТаблицаПоУмолчанию</Table>",
      "<Table>ТаблицаМодульНабора</Table>",
    ])
  })

  it("сохраняет reference-порядок форм таблиц из XML дочерних объектов", async () => {
    const rootDir = await fs.promises.mkdtemp(join(os.tmpdir(), "eds-sync-table-form-order-"))
    const inputDir = join(rootDir, "yaml")
    const outputDir = join(rootDir, "out")
    const referenceDir = join(rootDir, "reference")
    const externalReferenceDir = join(referenceDir, "ВнешнийИсточник")
    const objectDir = join(inputDir, "ВнешнийИсточник")
    const formYaml = `Элементы:
  ПолеВвода1:
    Вид: ПолеВвода
    Ширина: 10
    ПутьКДанным: Реквизит
Синоним: Форма
НазначенияИспользования: ПлатформаИМобильноеПриложение`

    await write(join(objectDir, "Свойства.yaml"), "Синоним: Синоним")
    await write(join(objectDir, "Таблицы/ТаблицаВсеСвойства/Свойства.yaml"), "ИмяВИсточникеДанных: ТаблицаSQL")
    await write(join(objectDir, "Таблицы/ТаблицаВсеСвойства/Формы/ФормаВыбора/Форма.yaml"), formYaml)
    await write(join(objectDir, "Таблицы/ТаблицаВсеСвойства/Формы/ФормаОбъекта/Форма.yaml"), formYaml)
    await write(join(objectDir, "Таблицы/ТаблицаВсеСвойства/Формы/ФормаСписка/Форма.yaml"), formYaml)
    await write(
      join(externalReferenceDir, "Tables/ТаблицаВсеСвойства.xml"),
      `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject>
  <Table>
    <ChildObjects>
      <Form>ФормаОбъекта</Form>
      <Form>ФормаСписка</Form>
      <Form>ФормаВыбора</Form>
    </ChildObjects>
  </Table>
</MetaDataObject>`
    )
    await fs.promises.cp(
      join(
        import.meta.dirname,
        "__fixtures__/sync/xml/ВнешнийИсточникДанныхВсеСвойства/Tables/ТаблицаВсеСвойства/Forms"
      ),
      join(externalReferenceDir, "Tables/ТаблицаВсеСвойства/Forms"),
      { recursive: true }
    )

    await syncAppliedObjectToXML({
      rule: MetadataExternalDataSourceRules,
      context: mockContextToXML(),
      inputDir,
      name: "ВнешнийИсточник",
      outputDir,
      referenceDir,
      externalReferenceDir,
    })

    expectOrderedXMLTags(fs.readFileSync(join(outputDir, "Tables/ТаблицаВсеСвойства.xml"), "utf-8"), [
      "<Form>ФормаОбъекта</Form>",
      "<Form>ФормаСписка</Form>",
      "<Form>ФормаВыбора</Form>",
    ])
  })

  it("сохраняет reference-порядок форм кубов из XML дочерних объектов", async () => {
    const rootDir = await fs.promises.mkdtemp(join(os.tmpdir(), "eds-sync-cube-form-order-"))
    const inputDir = join(rootDir, "yaml")
    const outputDir = join(rootDir, "out")
    const referenceDir = join(rootDir, "reference")
    const externalReferenceDir = join(referenceDir, "ВнешнийИсточник")
    const objectDir = join(inputDir, "ВнешнийИсточник")
    const formYaml = `Элементы:
  ПолеВвода1:
    Вид: ПолеВвода
    Ширина: 10
    ПутьКДанным: Реквизит
Синоним: Форма
НазначенияИспользования: ПлатформаИМобильноеПриложение`

    await write(join(objectDir, "Свойства.yaml"), "Синоним: Синоним")
    await write(join(objectDir, "Кубы/КубВсеСвойства/Свойства.yaml"), "ИмяВИсточникеДанных: КубSQL")
    await write(join(objectDir, "Кубы/КубВсеСвойства/Формы/ФормаЗаписи/Форма.yaml"), formYaml)
    await write(join(objectDir, "Кубы/КубВсеСвойства/Формы/ФормаСписка/Форма.yaml"), formYaml)
    await write(
      join(externalReferenceDir, "Cubes/КубВсеСвойства.xml"),
      `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject>
  <Cube>
    <ChildObjects>
      <Form>ФормаСписка</Form>
      <Form>ФормаЗаписи</Form>
    </ChildObjects>
  </Cube>
</MetaDataObject>`
    )
    await fs.promises.cp(
      join(import.meta.dirname, "__fixtures__/sync/xml/ВнешнийИсточникДанныхВсеСвойства/Cubes/КубВсеСвойства/Forms"),
      join(externalReferenceDir, "Cubes/КубВсеСвойства/Forms"),
      { recursive: true }
    )

    await syncAppliedObjectToXML({
      rule: MetadataExternalDataSourceRules,
      context: mockContextToXML(),
      inputDir,
      name: "ВнешнийИсточник",
      outputDir,
      referenceDir,
      externalReferenceDir,
    })

    expectOrderedXMLTags(fs.readFileSync(join(outputDir, "Cubes/КубВсеСвойства.xml"), "utf-8"), [
      "<Form>ФормаСписка</Form>",
      "<Form>ФормаЗаписи</Form>",
    ])
  })

  it("не восстанавливает формы дочерних объектов из reference, если текущая папка Формы пустая", async () => {
    const rootDir = await fs.promises.mkdtemp(join(os.tmpdir(), "eds-sync-empty-forms-"))
    const inputDir = join(rootDir, "yaml")
    const outputDir = join(rootDir, "out")
    const referenceDir = join(import.meta.dirname, "__fixtures__/sync/xml")
    const objectDir = join(inputDir, "ВнешнийИсточникДанныхВсеСвойства")

    await write(
      join(objectDir, "Свойства.yaml"),
      `Синоним: Синоним
Таблицы:
  ТаблицаВсеСвойства:
    ИмяВИсточникеДанных: ИмяВИсточнике
Кубы:
  КубВсеСвойства:
    ИмяВИсточникеДанных: ИмяВИсточнике`
    )
    await fs.promises.mkdir(join(objectDir, "Таблицы/ТаблицаВсеСвойства/Формы"), { recursive: true })
    await fs.promises.mkdir(join(objectDir, "Кубы/КубВсеСвойства/Формы"), { recursive: true })

    await syncAppliedObjectToXML({
      rule: MetadataExternalDataSourceRules,
      context: mockContextToXML(),
      inputDir,
      name: "ВнешнийИсточникДанныхВсеСвойства",
      outputDir,
      referenceDir,
    })

    const tableXml = fs.readFileSync(join(outputDir, "Tables/ТаблицаВсеСвойства.xml"), "utf-8")
    const cubeXml = fs.readFileSync(join(outputDir, "Cubes/КубВсеСвойства.xml"), "utf-8")
    expect(tableXml).not.toContain("<Form>")
    expect(cubeXml).not.toContain("<Form>")
    expect(fs.existsSync(join(outputDir, "Tables/ТаблицаВсеСвойства/Forms/ФормаВыбора.xml"))).toBe(false)
    expect(fs.existsSync(join(outputDir, "Cubes/КубВсеСвойства/Forms/ФормаЗаписи.xml"))).toBe(false)
  })

  it("ошибается, если основная форма дочернего объекта ссылается на отсутствующий YAML-файл формы", async () => {
    const rootDir = await fs.promises.mkdtemp(join(os.tmpdir(), "eds-sync-missing-form-"))
    const inputDir = join(rootDir, "yaml")
    const outputDir = join(rootDir, "out")
    const objectDir = join(inputDir, "ВнешнийИсточник")

    await write(join(objectDir, "Свойства.yaml"), "Синоним: Синоним")
    await write(
      join(objectDir, "Таблицы/Таблица/Свойства.yaml"),
      `ИмяВИсточникеДанных: ТаблицаSQL
ОсновнаяФормаСписка: ФормаСписка`
    )

    await expect(
      syncAppliedObjectToXML({
        rule: MetadataExternalDataSourceRules,
        context: mockContextToXML(),
        inputDir,
        name: "ВнешнийИсточник",
        outputDir,
        useReferenceXML: false,
      })
    ).rejects.toThrow(/Формы\/ФормаСписка\/Форма\.yaml/)
  })
})
