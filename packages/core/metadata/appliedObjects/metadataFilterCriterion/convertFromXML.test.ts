import fs from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "~/tests/appliedObject"
import { readFilterCriterionYAML } from "./__fixtures__/sync/data"
import { MetadataFilterCriterionRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataFilterCriterion", () => {
  const name = "КритерийОтбораВсеСвойства"

  it("читает FilterCriterion из XML и записывает Свойства.yaml + связанные модули и формы", async () => {
    const { outputDir, inputDir, yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataFilterCriterionRules,
      name,
      importMetaUrl: import.meta.url,
      expectedYAML: readFilterCriterionYAML,
    })

    expect(yaml.result).toBe(yaml.expected)

    const expectedFiles = [
      {
        input: join(inputDir, "Ext", "ManagerModule.bsl"),
        output: join(outputDir, name, "МодульМенеджера.bsl"),
      },
      {
        input: join(inputDir, "Commands", "Команда1", "Ext", "CommandModule.bsl"),
        output: join(outputDir, name, "Команды", "Команда1.bsl"),
      },
      {
        input: join(inputDir, name, "Forms", "ФормаСписка.xml"),
        output: join(outputDir, name, "Формы", "ФормаСписка", "Форма.yaml"),
      },
      {
        input: join(inputDir, name, "Forms", "ФормаСписка", "Ext", "Form.xml"),
        output: join(outputDir, name, "Формы", "ФормаСписка", "Форма.nkdk"),
        shouldExist: false,
      },
      {
        input: join(inputDir, name, "Forms", "ФормаСписка", "Ext", "Form", "Module.bsl"),
        output: join(outputDir, name, "Формы", "ФормаСписка", "Модуль.bsl"),
      },
    ]

    for (const { input, output, shouldExist = true } of expectedFiles) {
      if (!shouldExist) {
        expect(fs.existsSync(output), output).toBe(false)
        expect(fs.existsSync(input), input).toBe(true)
        continue
      }
      expect(fs.existsSync(output), output).toBe(true)
      expect(fs.existsSync(input), input).toBe(true)
      if (output.endsWith("Форма.yaml")) {
        expect(fs.readFileSync(output, "utf-8").length).toBeGreaterThan(0)
        continue
      }
      const expectedContent = fs.readFileSync(input, "utf-8")
      expect(fs.readFileSync(output, "utf-8"), output).toBe(expectedContent)
    }
  })
})
