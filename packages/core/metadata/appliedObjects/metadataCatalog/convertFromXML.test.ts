import fs from "fs"
import { join } from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { convertAppliedObjectFromXML } from "~/metadata/orchestration/appliedObject/convertFromXML"
import { mockContextFromXML } from "~/tests/mockContext"
import { readCatalogYAML } from "./__fixtures__/sync/data"
import { MetadataCatalogRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataCatalog", () => {
  const inputDir = join(import.meta.dirname, "__fixtures__/sync/xml")
  const outputDir = join(import.meta.dirname, "__fixtures__/sync/out")
  const catalogName = "СправочникCоВсемиОбъектами"

  beforeEach(() => {
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true })
    }
  })

  it("читает Catalog из XML и записывает Свойства.yaml в outputDir", async () => {
    await convertAppliedObjectFromXML({
      rule: MetadataCatalogRules,
      context: mockContextFromXML(),
      inputDir,
      name: catalogName,
      outputDir,
    })

    expect(fs.readFileSync(join(outputDir, catalogName, "Свойства.yaml"), "utf-8")).toBe(readCatalogYAML)

    const expectedObjectModule = fs.readFileSync(join(inputDir, "Ext", "ObjectModule.bsl"), "utf-8")
    expect(fs.readFileSync(join(outputDir, catalogName, "МодульОбъекта.bsl"), "utf-8")).toBe(expectedObjectModule)

    const expectedManagerModule = fs.readFileSync(join(inputDir, "Ext", "ManagerModule.bsl"), "utf-8")
    expect(fs.readFileSync(join(outputDir, catalogName, "МодульМенеджера.bsl"), "utf-8")).toBe(expectedManagerModule)

    const expectedHelpRu = fs.readFileSync(join(inputDir, "Ext", "Help", "ru.html"), "utf-8")
    expect(fs.readFileSync(join(outputDir, catalogName, "Справка", "ru.html"), "utf-8")).toBe(expectedHelpRu)

    const expectedCommandModule = fs.readFileSync(
      join(inputDir, "Commands", "КомандаОбъекта", "Ext", "CommandModule.bsl"),
      "utf-8"
    )
    expect(fs.readFileSync(join(outputDir, catalogName, "Команды", "КомандаОбъекта.bsl"), "utf-8")).toBe(
      expectedCommandModule
    )
  })
})
