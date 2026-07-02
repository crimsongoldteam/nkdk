import fs from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "../../../tests/appliedObject"
import { readDocumentJournalYAML } from "./__fixtures__/sync/data"
import { MetadataDocumentJournalRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataDocumentJournal", () => {
  const name = "ЖурналДокументовВсеСвойства"

  it("читает DocumentJournal из XML и записывает Свойства.yaml + связанные файлы", async () => {
    const { outputDir, inputDir, yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataDocumentJournalRules,
      name,
      importMetaUrl: import.meta.url,
      expectedYAML: readDocumentJournalYAML,
    })

    expect(yaml.result).toBe(yaml.expected)

    const objectDir = join(inputDir, name)

    const expectedManagerModule = fs.readFileSync(join(objectDir, "Ext", "ManagerModule.bsl"), "utf-8")
    expect(fs.readFileSync(join(outputDir, name, "МодульМенеджера.bsl"), "utf-8")).toBe(expectedManagerModule)

    const expectedHelpRu = fs.readFileSync(join(objectDir, "Ext", "Help", "ru.html"), "utf-8")
    expect(fs.readFileSync(join(outputDir, name, "Справка", "ru.html"), "utf-8")).toBe(expectedHelpRu)

    const expectedCommandModule = fs.readFileSync(
      join(objectDir, "Commands", "Команда1", "Ext", "CommandModule.bsl"),
      "utf-8"
    )
    expect(fs.readFileSync(join(outputDir, name, "Команды", "Команда1.bsl"), "utf-8")).toBe(expectedCommandModule)

    const expectedFormModule = fs.readFileSync(
      join(objectDir, "Forms", "ФормаСписка", "Ext", "Form", "Module.bsl"),
      "utf-8"
    )
    expect(fs.readFileSync(join(outputDir, name, "Формы", "ФормаСписка", "Модуль.bsl"), "utf-8")).toBe(
      expectedFormModule
    )

    const expectedTemplate = fs.readFileSync(join(objectDir, "Templates", "Макет", "Ext", "Template.txt"), "utf-8")
    expect(fs.readFileSync(join(outputDir, name, "Шаблоны", "Макет", "Template.txt"), "utf-8")).toBe(expectedTemplate)
  })
})
