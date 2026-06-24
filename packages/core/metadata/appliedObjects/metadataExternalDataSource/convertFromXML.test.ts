import fs from "fs"
import os from "os"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"
import { convertAppliedObjectFromXML } from "~/metadata/orchestration/appliedObject/convertFromXML"
import { testConvertAppliedObjectFromXML } from "~/tests/appliedObject"
import { mockContextFromXML } from "~/tests/mockContext"
import { importFromYAML } from "~/yaml/import"
import { readExternalDataSourceYAML } from "./__fixtures__/sync/data"
import { MetadataExternalDataSourceRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataExternalDataSource", () => {
  const name = "ВнешнийИсточникДанныхВсеСвойства"

  it("читает ExternalDataSource из XML и записывает дочерние file-item объекты в отдельные Свойства.yaml", async () => {
    const { outputDir, inputDir, yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataExternalDataSourceRules,
      name,
      importMetaUrl: import.meta.url,
      expectedYAML: readExternalDataSourceYAML,
    })

    expect(yaml.result).toBe(yaml.expected)
    const rootModel = importFromYAML<Record<string, unknown>>(yaml.result)
    expect(rootModel["Таблицы"]).toBeUndefined()
    expect(rootModel["Кубы"]).toBeUndefined()
    expect(rootModel["Функции"]).toBeDefined()

    const tableYAML = fs.readFileSync(
      join(outputDir, name, "Таблицы/ТаблицаВсеСвойства/Свойства.yaml"),
      "utf-8"
    )
    const tableModel = importFromYAML<Record<string, unknown>>(tableYAML)
    expect(tableModel["ИмяВИсточникеДанных"]).toBe("ИмяВИсточнике")

    const cubeYAML = fs.readFileSync(join(outputDir, name, "Кубы/КубВсеСвойства/Свойства.yaml"), "utf-8")
    const cubeModel = importFromYAML<Record<string, unknown>>(cubeYAML)
    expect(cubeModel["ИмяВИсточникеДанных"]).toBe("ИмяВИсточнике")
    expect(cubeModel["ТаблицыИзмерений"]).toBeUndefined()

    const dimensionTableYAML = fs.readFileSync(
      join(outputDir, name, "Кубы/КубВсеСвойства/ТаблицыИзмерений/ТаблицаИзмеренияВсеСвойства/Свойства.yaml"),
      "utf-8"
    )
    const dimensionTableModel = importFromYAML<Record<string, unknown>>(dimensionTableYAML)
    expect(dimensionTableModel["ИмяВИсточникеДанных"]).toBe("Имя в источнике данных")

    expect(
      fs.existsSync(join(outputDir, name, "Таблицы/ТаблицаВсеСвойства/Формы/ФормаСписка/Форма.yaml"))
    ).toBe(true)
    expect(fs.existsSync(join(outputDir, name, "Кубы/КубВсеСвойства/Формы/ФормаЗаписи/Форма.yaml"))).toBe(true)
    expect(fs.readFileSync(join(outputDir, name, "Таблицы/ТаблицаВсеСвойства/МодульМенеджера.bsl"), "utf-8")).toBe(
      fs.readFileSync(join(inputDir, name, "Tables/ТаблицаВсеСвойства/Ext/ManagerModule.bsl"), "utf-8")
    )
    expect(fs.readFileSync(join(outputDir, name, "Таблицы/ТаблицаВсеСвойства/Команды/Команда1.bsl"), "utf-8")).toBe(
      fs.readFileSync(join(inputDir, name, "Tables/ТаблицаВсеСвойства/Commands/Команда1/Ext/CommandModule.bsl"), "utf-8")
    )
    expect(fs.readFileSync(join(outputDir, name, "Таблицы/ТаблицаВсеСвойства/Справка/ru.html"), "utf-8")).toBe(
      fs.readFileSync(join(inputDir, name, "Tables/ТаблицаВсеСвойства/Ext/Help/ru.html"), "utf-8")
    )
    expect(fs.readFileSync(join(outputDir, name, "Кубы/КубВсеСвойства/МодульНабораЗаписей.bsl"), "utf-8")).toBe(
      fs.readFileSync(join(inputDir, name, "Cubes/КубВсеСвойства/Ext/RecordSetModule.bsl"), "utf-8")
    )
    expect(fs.readFileSync(join(outputDir, name, "Кубы/КубВсеСвойства/Справка/ru.html"), "utf-8")).toBe(
      fs.readFileSync(join(inputDir, name, "Cubes/КубВсеСвойства/Ext/Help/ru.html"), "utf-8")
    )
    expect(
      fs.readFileSync(
        join(outputDir, name, "Кубы/КубВсеСвойства/ТаблицыИзмерений/ТаблицаИзмеренияВсеСвойства/МодульМенеджера.bsl"),
        "utf-8"
      )
    ).toBe(
      fs.readFileSync(
        join(inputDir, name, "Cubes/КубВсеСвойства/DimensionTables/ТаблицаИзмеренияВсеСвойства/Ext/ManagerModule.bsl"),
        "utf-8"
      )
    )
  })

  it("читает дочернюю таблицу ExternalDataSource из строковой ссылки в родительском XML", async () => {
    const testDir = dirname(fileURLToPath(import.meta.url))
    const fixtureInputDir = join(testDir, "__fixtures__", "sync", "xml")
    const tmpRoot = fs.mkdtempSync(join(os.tmpdir(), "external-data-source-reference-children-"))
    const inputDir = join(tmpRoot, "xml")
    const outputDir = join(tmpRoot, "out")
    const referenceTableName = "ТаблицаСтроковая"

    try {
      fs.cpSync(fixtureInputDir, inputDir, { recursive: true })
      fs.cpSync(
        join(inputDir, name, "Tables", "ТаблицаВсеСвойства"),
        join(inputDir, name, "Tables", referenceTableName),
        { recursive: true }
      )
      const referenceTableXMLPath = join(inputDir, name, "Tables", `${referenceTableName}.xml`)
      fs.writeFileSync(
        referenceTableXMLPath,
        fs
          .readFileSync(join(inputDir, name, "Tables", "ТаблицаВсеСвойства.xml"), "utf-8")
          .split("ТаблицаВсеСвойства")
          .join(referenceTableName)
          .replace("ИмяВИсточнике", "ИмяВИсточникеСтроковая"),
        "utf-8"
      )

      const parentXMLPath = join(inputDir, `${name}.xml`)
      const parentXML = fs.readFileSync(parentXMLPath, "utf-8")
      const parentWithTableReference = parentXML.replace(
        "\n\t\t\t<Table>ТаблицаВсеСвойства</Table>",
        `\n\t\t\t<Table>${referenceTableName}</Table>\n\t\t\t<Table>ТаблицаВсеСвойства</Table>`
      )
      expect(parentWithTableReference).not.toBe(parentXML)
      fs.writeFileSync(parentXMLPath, parentWithTableReference, "utf-8")

      await convertAppliedObjectFromXML({
        rule: MetadataExternalDataSourceRules,
        context: mockContextFromXML(),
        inputDir,
        name,
        outputDir,
      })

      const rootYAML = fs.readFileSync(join(outputDir, name, "Свойства.yaml"), "utf-8")
      const rootModel = importFromYAML<Record<string, unknown>>(rootYAML)
      expect(rootModel["Таблицы"]).toBeUndefined()

      const tableYAML = fs.readFileSync(join(outputDir, name, `Таблицы/${referenceTableName}/Свойства.yaml`), "utf-8")
      const tableModel = importFromYAML<Record<string, unknown>>(tableYAML)
      expect(tableModel["ИмяВИсточникеДанных"]).toBe("ИмяВИсточникеСтроковая")
      const originalTableYAML = fs.readFileSync(
        join(outputDir, name, "Таблицы/ТаблицаВсеСвойства/Свойства.yaml"),
        "utf-8"
      )
      const originalTableModel = importFromYAML<Record<string, unknown>>(originalTableYAML)
      expect(originalTableModel["ИмяВИсточникеДанных"]).toBe("ИмяВИсточнике")
      expect(fs.readFileSync(join(outputDir, name, `Таблицы/${referenceTableName}/МодульМенеджера.bsl`), "utf-8")).toBe(
        fs.readFileSync(join(inputDir, name, `Tables/${referenceTableName}/Ext/ManagerModule.bsl`), "utf-8")
      )
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true })
    }
  })
})
