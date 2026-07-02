import fs from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "../../../tests/appliedObject"
import { readAccumulationRegisterYAML } from "./__fixtures__/sync/data"
import { MetadataAccumulationRegisterRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataAccumulationRegister", () => {
  const name = "РегистрНакопленияВсеСвойстваОбороты"

  it("читает AccumulationRegister из XML и записывает Свойства.yaml + связанные файлы", async () => {
    const { outputDir, inputDir, yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataAccumulationRegisterRules,
      name,
      importMetaUrl: import.meta.url,
      expectedYAML: readAccumulationRegisterYAML,
    })

    expect(yaml.result).toBe(yaml.expected)

    const objectDir = join(inputDir, name)

    const expectedManagerModule = fs.readFileSync(join(objectDir, "Ext", "ManagerModule.bsl"), "utf-8")
    expect(fs.readFileSync(join(outputDir, name, "МодульМенеджера.bsl"), "utf-8")).toBe(expectedManagerModule)

    const expectedRecordSetModule = fs.readFileSync(join(objectDir, "Ext", "RecordSetModule.bsl"), "utf-8")
    expect(fs.readFileSync(join(outputDir, name, "МодульНабораЗаписей.bsl"), "utf-8")).toBe(expectedRecordSetModule)

    const expectedHelpRu = fs.readFileSync(join(objectDir, "Ext", "Help", "ru.html"), "utf-8")
    expect(fs.readFileSync(join(outputDir, name, "Справка", "ru.html"), "utf-8")).toBe(expectedHelpRu)

    const expectedCommandModule = fs.readFileSync(
      join(objectDir, "Commands", "Команда1", "Ext", "CommandModule.bsl"),
      "utf-8"
    )
    expect(fs.readFileSync(join(outputDir, name, "Команды", "Команда1.bsl"), "utf-8")).toBe(expectedCommandModule)

    const expectedListFormModule = fs.readFileSync(
      join(objectDir, "Forms", "ФормаСписка", "Ext", "Form", "Module.bsl"),
      "utf-8"
    )
    expect(fs.readFileSync(join(outputDir, name, "Формы", "ФормаСписка", "Модуль.bsl"), "utf-8")).toBe(
      expectedListFormModule
    )

    const expectedTemplate = fs.readFileSync(join(objectDir, "Templates", "Макет.xml"), "utf-8")
    expect(fs.readFileSync(join(outputDir, name, "Шаблоны", "Макет", "Template.xml"), "utf-8")).toBe(expectedTemplate)
  })
})
