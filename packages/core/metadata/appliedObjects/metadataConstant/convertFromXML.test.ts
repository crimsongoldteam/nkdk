import fs from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "~/tests/appliedObject"
import { readConstantYAML } from "./__fixtures__/sync/data"
import { MetadataConstantRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataConstant", () => {
  const name = "КонстантаВсеСвойства"

  it("читает Constant из XML и записывает Свойства.yaml + связанные модули", async () => {
    const { outputDir, inputDir, yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataConstantRules,
      name,
      importMetaUrl: import.meta.url,
      expectedYAML: readConstantYAML,
    })

    expect(yaml.result).toBe(yaml.expected)

    const expectedManagerModule = fs.readFileSync(join(inputDir, "Ext", "ManagerModule.bsl"), "utf-8")
    expect(fs.readFileSync(join(outputDir, name, "МодульМенеджера.bsl"), "utf-8")).toBe(expectedManagerModule)

    const expectedValueManagerModule = fs.readFileSync(
      join(inputDir, "Ext", "ValueManagerModule.bsl"),
      "utf-8"
    )
    expect(fs.readFileSync(join(outputDir, name, "МодульМенеджераЗначения.bsl"), "utf-8")).toBe(
      expectedValueManagerModule
    )
  })
})
