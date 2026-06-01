import { describe, expect, it } from "vitest"
import fs from "fs"
import os from "os"
import { join } from "path"
import { syncAppliedObjectToXML } from "~/metadata/orchestration/appliedObject/syncToXML"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { mockContextToXML } from "~/tests/mockContext"
import { MetadataExternalDataSourceRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

const write = async (path: string, content: string) => {
  await fs.promises.mkdir(join(path, ".."), { recursive: true })
  await fs.promises.writeFile(path, content, "utf-8")
}

describe("syncAppliedObjectToXML — MetadataExternalDataSource", () => {
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
      Команда1: ПанельНавигацииФормыПерейти
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
    expect(fs.readFileSync(join(outputDir, "Tables/ТаблицаВсеСвойства/Commands/Команда1/Ext/CommandModule.bsl"), "utf-8")).toBe(
      "// table command"
    )
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
    ).toBe(
      "<html>dimension table help</html>"
    )
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
})
