import fs from "fs"
import os from "os"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"
import { convertAppliedObjectFromXML } from "../../orchestration/appliedObject/convertFromXML"
import { testConvertAppliedObjectFromXML } from "../../../tests/appliedObject"
import { mockContextFromXML } from "../../../tests/mockContext"
import { readInformationRegisterYAML } from "./__fixtures__/sync/data"
import { MetadataInformationRegisterRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataInformationRegister", () => {
  const name = "РегистрСведенийВсеСвойстваНезависимый"

  it("читает InformationRegister из XML и записывает Свойства.yaml + связанные файлы", async () => {
    const { outputDir, inputDir, yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataInformationRegisterRules,
      name,
      importMetaUrl: import.meta.url,
      expectedYAML: readInformationRegisterYAML,
    })

    expect(yaml.result).toBe(yaml.expected)

    const objectDir = join(inputDir, name)

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

    const expectedRecordFormModule = fs.readFileSync(
      join(objectDir, "Forms", "ФормаЗаписи", "Ext", "Form", "Module.bsl"),
      "utf-8"
    )
    expect(fs.readFileSync(join(outputDir, name, "Формы", "ФормаЗаписи", "Модуль.bsl"), "utf-8")).toBe(
      expectedRecordFormModule
    )

    const expectedTemplate = fs.readFileSync(join(objectDir, "Templates", "Макет.xml"), "utf-8")
    expect(fs.readFileSync(join(outputDir, name, "Шаблоны", "Макет", "Template.xml"), "utf-8")).toBe(expectedTemplate)

    const expectedHelpRu = fs.readFileSync(join(objectDir, "Ext", "Help", "ru.html"), "utf-8")
    expect(fs.readFileSync(join(outputDir, name, "Справка", "ru.html"), "utf-8")).toBe(expectedHelpRu)
  })

  it("читает object-level модули регистра сведений из XML во временной фикстуре", async () => {
    const testDir = dirname(fileURLToPath(import.meta.url))
    const fixturesDir = join(testDir, "__fixtures__", "sync")
    const tmpDir = fs.mkdtempSync(join(os.tmpdir(), "information-register-modules-"))
    const fixtureDir = join(tmpDir, "sync")
    const inputDir = join(fixtureDir, "xml")
    const outputDir = join(tmpDir, "out")
    const managerModule =
      "Процедура ОбработкаПолученияДанныхВыбора(ДанныеВыбора, Параметры, СтандартнаяОбработка)\nКонецПроцедуры\n"
    const recordSetModule = "Процедура ПередЗаписью(Отказ, Замещение)\nКонецПроцедуры\n"

    await fs.promises.cp(fixturesDir, fixtureDir, { recursive: true })
    await fs.promises.mkdir(join(inputDir, name, "Ext"), { recursive: true })
    await fs.promises.writeFile(join(inputDir, name, "Ext", "ManagerModule.bsl"), managerModule)
    await fs.promises.writeFile(join(inputDir, name, "Ext", "RecordSetModule.bsl"), recordSetModule)

    await convertAppliedObjectFromXML({
      rule: MetadataInformationRegisterRules,
      context: mockContextFromXML(),
      inputDir,
      name,
      outputDir,
    })

    expect(fs.readFileSync(join(outputDir, name, "МодульМенеджера.bsl"), "utf-8")).toBe(managerModule)
    expect(fs.readFileSync(join(outputDir, name, "МодульНабораЗаписей.bsl"), "utf-8")).toBe(recordSetModule)
  })
})
