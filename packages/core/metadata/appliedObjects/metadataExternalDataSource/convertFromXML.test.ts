import fs from "fs"
import os from "os"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"
import { convertAppliedObjectFromXML } from "~/metadata/orchestration/appliedObject/convertFromXML"
import { testConvertAppliedObjectFromXML } from "~/tests/appliedObject"
import { mockContextFromXML } from "~/tests/mockContext"
import { readExternalDataSourceYAML } from "./__fixtures__/sync/data"
import { MetadataExternalDataSourceRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataExternalDataSource", () => {
  const name = "ВнешнийИсточникДанныхВсеСвойства"

  it("читает ExternalDataSource из XML и записывает единый Свойства.yaml + внешние файлы дочерних объектов", async () => {
    const { outputDir, inputDir, yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataExternalDataSourceRules,
      name,
      importMetaUrl: import.meta.url,
      expectedYAML: readExternalDataSourceYAML,
    })

    expect(yaml.result).toBe(yaml.expected)
    expect(fs.readFileSync(join(outputDir, name, "Таблицы/ТаблицаНоменклатура/МодульМенеджера.bsl"), "utf-8")).toBe(
      fs.readFileSync(join(inputDir, "Tables/ТаблицаНоменклатура/Ext/ManagerModule.bsl"), "utf-8")
    )
    expect(fs.readFileSync(join(outputDir, name, "Таблицы/ТаблицаНоменклатура/Команды/Команда1.bsl"), "utf-8")).toBe(
      fs.readFileSync(join(inputDir, "Tables/ТаблицаНоменклатура/Commands/Команда1/Ext/CommandModule.bsl"), "utf-8")
    )
    expect(fs.readFileSync(join(outputDir, name, "Таблицы/ТаблицаНоменклатура/Справка/ru.html"), "utf-8")).toBe(
      fs.readFileSync(join(inputDir, "Tables/ТаблицаНоменклатура/Ext/Help/ru.html"), "utf-8")
    )
    expect(fs.readFileSync(join(outputDir, name, "Кубы/Продажи/МодульНабораЗаписей.bsl"), "utf-8")).toBe(
      fs.readFileSync(join(inputDir, "Cubes/Продажи/Ext/RecordSetModule.bsl"), "utf-8")
    )
    expect(fs.readFileSync(join(outputDir, name, "Кубы/Продажи/Справка/ru.html"), "utf-8")).toBe(
      fs.readFileSync(join(inputDir, "Cubes/Продажи/Ext/Help/ru.html"), "utf-8")
    )
    expect(
      fs.readFileSync(join(outputDir, name, "Кубы/Продажи/ТаблицыИзмерений/Номенклатура/МодульМенеджера.bsl"), "utf-8")
    ).toBe(fs.readFileSync(join(inputDir, "Cubes/Продажи/DimensionTables/Номенклатура/Ext/ManagerModule.bsl"), "utf-8"))
    expect(
      fs.readFileSync(join(outputDir, name, "Кубы/Продажи/ТаблицыИзмерений/Номенклатура/Справка/ru.html"), "utf-8")
    ).toBe(fs.readFileSync(join(inputDir, "Cubes/Продажи/DimensionTables/Номенклатура/Ext/Help/ru.html"), "utf-8"))
  })

  it("читает дочернюю таблицу ExternalDataSource из строковой ссылки в родительском XML", async () => {
    const testDir = dirname(fileURLToPath(import.meta.url))
    const fixtureInputDir = join(testDir, "__fixtures__", "sync", "xml")
    const tmpRoot = fs.mkdtempSync(join(os.tmpdir(), "external-data-source-reference-children-"))
    const inputDir = join(tmpRoot, "xml")
    const outputDir = join(tmpRoot, "out")

    try {
      fs.cpSync(fixtureInputDir, inputDir, { recursive: true })

      const parentXMLPath = join(inputDir, `${name}.xml`)
      const parentXML = fs.readFileSync(parentXMLPath, "utf-8")
      const parentWithTableReference = parentXML.replace(
        /\n\t\t\t<Table uuid="[^"]+">[\s\S]*?\n\t\t\t<\/Table>/,
        "\n\t\t\t<Table>ТаблицаНоменклатура</Table>"
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

      const yaml = fs.readFileSync(join(outputDir, name, "Свойства.yaml"), "utf-8")
      expect(yaml).toContain("Таблицы:\n  ТаблицаНоменклатура:")
      expect(yaml).toContain("ИмяВИсточникеДанных: Catalog_Items")
      expect(fs.readFileSync(join(outputDir, name, "Таблицы/ТаблицаНоменклатура/МодульМенеджера.bsl"), "utf-8")).toBe(
        fs.readFileSync(join(inputDir, "Tables/ТаблицаНоменклатура/Ext/ManagerModule.bsl"), "utf-8")
      )
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true })
    }
  })
})
