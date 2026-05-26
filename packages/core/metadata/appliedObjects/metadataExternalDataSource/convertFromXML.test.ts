import fs from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "~/tests/appliedObject"
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
})
