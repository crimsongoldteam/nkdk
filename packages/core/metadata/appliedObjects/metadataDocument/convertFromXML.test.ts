import fs from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "../../../tests/appliedObject"
import { readDocumentYAML } from "./__fixtures__/sync/data"
import { MetadataDocumentRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataDocument", () => {
  const name = "ДокументВсеСвойства"

  it("читает Document из XML и пишет Свойства.yaml + связанные модули", async () => {
    const { outputDir, inputDir, yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataDocumentRules,
      name,
      importMetaUrl: import.meta.url,
      expectedYAML: readDocumentYAML,
    })

    expect(yaml.result).toBe(yaml.expected)

    const objectDir = join(inputDir, name)

    const expectedObjectModule = fs.readFileSync(join(objectDir, "Ext", "ObjectModule.bsl"), "utf-8")
    expect(fs.readFileSync(join(outputDir, name, "МодульОбъекта.bsl"), "utf-8")).toBe(expectedObjectModule)

    const expectedManagerModule = fs.readFileSync(join(objectDir, "Ext", "ManagerModule.bsl"), "utf-8")
    expect(fs.readFileSync(join(outputDir, name, "МодульМенеджера.bsl"), "utf-8")).toBe(expectedManagerModule)

    const expectedCommandModule = fs.readFileSync(
      join(objectDir, "Commands", "Команда1", "Ext", "CommandModule.bsl"),
      "utf-8"
    )
    expect(fs.readFileSync(join(outputDir, name, "Команды", "Команда1.bsl"), "utf-8")).toBe(expectedCommandModule)

    const expectedHelpPage = fs.readFileSync(join(objectDir, "Ext", "Help", "ru.html"), "utf-8")
    expect(fs.readFileSync(join(outputDir, name, "Справка", "ru.html"), "utf-8")).toBe(expectedHelpPage)

    const expectedHelpLogo = fs.readFileSync(join(objectDir, "Ext", "Help", "_files", "logo.png"), "utf-8")
    expect(fs.readFileSync(join(outputDir, name, "Справка", "_files", "logo.png"), "utf-8")).toBe(expectedHelpLogo)
  })
})
