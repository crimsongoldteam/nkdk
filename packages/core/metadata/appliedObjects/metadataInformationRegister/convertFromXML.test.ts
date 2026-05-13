import fs from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "~/tests/appliedObject"
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
  })
})
