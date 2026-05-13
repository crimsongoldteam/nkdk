import fs from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "~/tests/appliedObject"
import { readSettingsStorageYAML } from "./__fixtures__/sync/data"
import { MetadataSettingsStorageRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataSettingsStorage", () => {
  const name = "ХранилищеНастроекВсеСвойства"

  it("читает SettingsStorage из XML и записывает Свойства.yaml + связанные формы и шаблоны", async () => {
    const { outputDir, inputDir, yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataSettingsStorageRules,
      name,
      importMetaUrl: import.meta.url,
      expectedYAML: readSettingsStorageYAML,
    })

    expect(yaml.result).toBe(yaml.expected)

    for (const formName of ["ФормаЗагрузки", "ФормаСохранения"]) {
      expect(fs.existsSync(join(inputDir, name, "Forms", `${formName}.xml`))).toBe(true)
      expect(fs.existsSync(join(inputDir, name, "Forms", formName, "Ext", "Form.xml"))).toBe(true)
      const formYaml = join(outputDir, name, "Формы", formName, "Форма.yaml")
      expect(fs.existsSync(formYaml), formYaml).toBe(true)
      expect(fs.readFileSync(formYaml, "utf-8").length, formYaml).toBeGreaterThan(0)
    }

    const expectedTemplateFiles = [
      {
        input: join(inputDir, name, "Templates", "Макет.xml"),
        output: join(outputDir, name, "Шаблоны", "Макет", "Template.xml"),
      },
      {
        input: join(inputDir, name, "Templates", "Макет", "Ext", "Template.txt"),
        output: join(outputDir, name, "Шаблоны", "Макет", "Template.txt"),
      },
    ]

    for (const { input, output } of expectedTemplateFiles) {
      expect(fs.existsSync(output), output).toBe(true)
      expect(fs.existsSync(input), input).toBe(true)
      const expectedContent = fs.readFileSync(input, "utf-8")
      expect(fs.readFileSync(output, "utf-8"), output).toBe(expectedContent)
    }
  })
})
