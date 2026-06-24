import fs from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "~/tests/appliedObject"
import { readDataProcessorYAML } from "./__fixtures__/sync/data"
import { MetadataDataProcessorRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataDataProcessor", () => {
  const name = "ОбработкаВсеСвойства"

  it("читает DataProcessor из XML и записывает Свойства.yaml + связанные файлы", async () => {
    const { outputDir, inputDir, yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataDataProcessorRules,
      name,
      importMetaUrl: import.meta.url,
      expectedYAML: readDataProcessorYAML,
    })

    expect(yaml.result).toBe(yaml.expected)

    const objectDir = join(inputDir, name)

    const expectedObjectModule = fs.readFileSync(join(objectDir, "Ext", "ObjectModule.bsl"), "utf-8")
    expect(fs.readFileSync(join(outputDir, name, "МодульОбъекта.bsl"), "utf-8")).toBe(expectedObjectModule)

    const expectedManagerModule = fs.readFileSync(join(objectDir, "Ext", "ManagerModule.bsl"), "utf-8")
    expect(fs.readFileSync(join(outputDir, name, "МодульМенеджера.bsl"), "utf-8")).toBe(expectedManagerModule)

    const expectedHelpRu = fs.readFileSync(join(objectDir, "Ext", "Help", "ru.html"), "utf-8")
    expect(fs.readFileSync(join(outputDir, name, "Справка", "ru.html"), "utf-8")).toBe(expectedHelpRu)

    const expectedCommandModule = fs.readFileSync(
      join(objectDir, "Commands", "Команда1", "Ext", "CommandModule.bsl"),
      "utf-8"
    )
    expect(fs.readFileSync(join(outputDir, name, "Команды", "Команда1.bsl"), "utf-8")).toBe(expectedCommandModule)

    const expectedTemplate = fs.readFileSync(join(objectDir, "Templates", "Макет", "Ext", "Template.txt"), "utf-8")
    expect(fs.readFileSync(join(outputDir, name, "Шаблоны", "Макет", "Template.txt"), "utf-8")).toBe(expectedTemplate)

    const expectedFormModule = fs.readFileSync(join(objectDir, "Forms", "Форма", "Ext", "Form", "Module.bsl"), "utf-8")
    expect(fs.readFileSync(join(outputDir, name, "Формы", "Форма", "Модуль.bsl"), "utf-8")).toBe(expectedFormModule)

    const expectedFormHelp = fs.readFileSync(join(objectDir, "Forms", "Форма", "Ext", "Help", "ru.html"), "utf-8")
    expect(fs.readFileSync(join(outputDir, name, "Формы", "Форма", "Справка", "ru.html"), "utf-8")).toBe(
      expectedFormHelp
    )
  })
})
