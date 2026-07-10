import fs from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "../../../tests/appliedObject"
import { readCommonModuleYAML } from "./__fixtures__/sync/data"
import { MetadataCommonModuleRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataCommonModule", () => {
  const name = "ОбщийМодульГлобальный"

  it("читает CommonModule из XML и записывает Свойства.yaml + модуль", async () => {
    const { outputDir, inputDir, yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataCommonModuleRules,
      name,
      importMetaUrl: import.meta.url,
      expectedYAML: readCommonModuleYAML,
    })

    expect(yaml.result).toBe(yaml.expected)
    expect(fs.readFileSync(join(outputDir, name, "Модуль.bsl"), "utf-8")).toBe(
      fs.readFileSync(join(inputDir, name, "Ext", "Module.bsl"), "utf-8")
    )
  })
})
