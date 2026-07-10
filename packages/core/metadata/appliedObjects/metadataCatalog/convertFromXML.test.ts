import fs from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "../../../tests/appliedObject"
import { readCatalogYAML } from "./__fixtures__/sync/data"
import { MetadataCatalogRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataCatalog", () => {
  const name = "СправочникCоВсемиОбъектами"

  it("читает Catalog из XML и записывает Свойства.yaml + связанные модули", async () => {
    const { outputDir, inputDir, yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataCatalogRules,
      name,
      importMetaUrl: import.meta.url,
      expectedYAML: readCatalogYAML,
    })

    expect(yaml.result).toBe(yaml.expected)

    const expectedObjectModule = fs.readFileSync(join(inputDir, "Ext", "ObjectModule.bsl"), "utf-8")
    expect(fs.readFileSync(join(outputDir, name, "МодульОбъекта.bsl"), "utf-8")).toBe(expectedObjectModule)

    const expectedManagerModule = fs.readFileSync(join(inputDir, "Ext", "ManagerModule.bsl"), "utf-8")
    expect(fs.readFileSync(join(outputDir, name, "МодульМенеджера.bsl"), "utf-8")).toBe(expectedManagerModule)

    const expectedHelpRu = fs.readFileSync(join(inputDir, "Ext", "Help", "ru.html"), "utf-8")
    expect(fs.readFileSync(join(outputDir, name, "Справка", "ru.html"), "utf-8")).toBe(expectedHelpRu)

    const expectedCommandModule = fs.readFileSync(
      join(inputDir, "Commands", "КомандаОбъекта", "Ext", "CommandModule.bsl"),
      "utf-8"
    )
    expect(fs.readFileSync(join(outputDir, name, "Команды", "КомандаОбъекта.bsl"), "utf-8")).toBe(expectedCommandModule)
  })
})
