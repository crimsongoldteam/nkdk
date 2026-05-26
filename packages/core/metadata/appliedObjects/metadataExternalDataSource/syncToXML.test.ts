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
      expectedFiles: [
        "ВнешнийИсточникДанныхВсеСвойства.xml",
        "Tables/ТаблицаНоменклатура.xml",
        "Tables/ТаблицаНоменклатура/Ext/ManagerModule.bsl",
        "Tables/ТаблицаНоменклатура/Ext/Help.xml",
        "Tables/ТаблицаНоменклатура/Ext/Help/ru.html",
        "Tables/ТаблицаНоменклатура/Commands/Команда1/Ext/CommandModule.bsl",
        "Cubes/Продажи.xml",
        "Cubes/Продажи/Ext/RecordSetModule.bsl",
        "Cubes/Продажи/Ext/Help.xml",
        "Cubes/Продажи/Ext/Help/ru.html",
        "Cubes/Продажи/DimensionTables/Номенклатура.xml",
        "Cubes/Продажи/DimensionTables/Номенклатура/Ext/ManagerModule.bsl",
        "Cubes/Продажи/DimensionTables/Номенклатура/Ext/Help.xml",
        "Cubes/Продажи/DimensionTables/Номенклатура/Ext/Help/ru.html",
      ],
    })

    for (const { path, result, expected } of comparisons) {
      expect(normalizeLineEndings(result), path).toBe(normalizeLineEndings(expected))
    }

    expect(
      fs.existsSync(
        join(
          outputDir,
          "Tables",
          "ТаблицаНоменклатура",
          "Tables",
          "ТаблицаНоменклатура"
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
  ТаблицаНоменклатура:
    ИмяВИсточникеДанных: Catalog_Items
    Команды:
      Команда1: ПанельНавигацииФормыПерейти
Кубы:
  Продажи:
    ИмяВИсточникеДанных: Sales
    ТаблицыИзмерений:
      Номенклатура:
        ИмяВИсточникеДанных: Dim_Items`
    )
    await write(join(objectDir, "Таблицы/ТаблицаНоменклатура/МодульМенеджера.bsl"), "// table manager")
    await write(join(objectDir, "Таблицы/ТаблицаНоменклатура/Команды/Команда1.bsl"), "// table command")
    await write(join(objectDir, "Таблицы/ТаблицаНоменклатура/Справка/ru.html"), "<html>table help</html>")
    await write(join(objectDir, "Кубы/Продажи/МодульНабораЗаписей.bsl"), "// cube record set")
    await write(join(objectDir, "Кубы/Продажи/Справка/ru.html"), "<html>cube help</html>")
    await write(
      join(objectDir, "Кубы/Продажи/ТаблицыИзмерений/Номенклатура/МодульМенеджера.bsl"),
      "// dimension table manager"
    )
    await write(
      join(objectDir, "Кубы/Продажи/ТаблицыИзмерений/Номенклатура/Справка/ru.html"),
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

    expect(fs.readFileSync(join(outputDir, "Tables/ТаблицаНоменклатура/Ext/ManagerModule.bsl"), "utf-8")).toBe(
      "// table manager"
    )
    expect(fs.readFileSync(join(outputDir, "Tables/ТаблицаНоменклатура/Commands/Команда1/Ext/CommandModule.bsl"), "utf-8")).toBe(
      "// table command"
    )
    expect(fs.existsSync(join(outputDir, "Tables/ТаблицаНоменклатура/Tables/ТаблицаНоменклатура"))).toBe(false)
    expect(fs.readFileSync(join(outputDir, "Tables/ТаблицаНоменклатура/Ext/Help/ru.html"), "utf-8")).toBe(
      "<html>table help</html>"
    )
    expect(fs.readFileSync(join(outputDir, "Cubes/Продажи/Ext/RecordSetModule.bsl"), "utf-8")).toBe(
      "// cube record set"
    )
    expect(fs.readFileSync(join(outputDir, "Cubes/Продажи/Ext/Help/ru.html"), "utf-8")).toBe(
      "<html>cube help</html>"
    )
    expect(
      fs.readFileSync(join(outputDir, "Cubes/Продажи/DimensionTables/Номенклатура/Ext/ManagerModule.bsl"), "utf-8")
    ).toBe("// dimension table manager")
    expect(fs.readFileSync(join(outputDir, "Cubes/Продажи/DimensionTables/Номенклатура/Ext/Help/ru.html"), "utf-8")).toBe(
      "<html>dimension table help</html>"
    )
  })
})
