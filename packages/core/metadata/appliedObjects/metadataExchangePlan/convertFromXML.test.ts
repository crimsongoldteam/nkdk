import fs from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "../../../tests/appliedObject"
import { readExchangePlanYAML } from "./__fixtures__/sync/data"
import { MetadataExchangePlanRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataExchangePlan", () => {
  const name = "ПланОбменаВсеСвойства"

  it("читает ExchangePlan из XML и записывает Свойства.yaml + связанные файлы", async () => {
    const { outputDir, inputDir, yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataExchangePlanRules,
      name,
      importMetaUrl: import.meta.url,
      expectedYAML: readExchangePlanYAML,
    })

    expect(yaml.result).toBe(yaml.expected)

    const objectDir = join(inputDir, name)

    expect(fs.readFileSync(join(outputDir, name, "МодульОбъекта.bsl"), "utf-8")).toBe(
      fs.readFileSync(join(objectDir, "Ext", "ObjectModule.bsl"), "utf-8")
    )
    expect(fs.readFileSync(join(outputDir, name, "МодульМенеджера.bsl"), "utf-8")).toBe(
      fs.readFileSync(join(objectDir, "Ext", "ManagerModule.bsl"), "utf-8")
    )
    expect(fs.readFileSync(join(outputDir, name, "Команды", "Команда1.bsl"), "utf-8")).toBe(
      fs.readFileSync(join(objectDir, "Commands", "Команда1", "Ext", "CommandModule.bsl"), "utf-8")
    )
    expect(fs.readFileSync(join(outputDir, name, "Шаблоны", "Макет", "Template.xml"), "utf-8")).toBe(
      fs.readFileSync(join(objectDir, "Templates", "Макет.xml"), "utf-8")
    )
  })
})
