import fs from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "~/tests/appliedObject"
import { readBotYAML } from "./__fixtures__/sync/data"
import { MetadataBotRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataBot", () => {
  const name = "БотВсеСвойства"

  it("читает Bot из XML и записывает Свойства.yaml + модуль", async () => {
    const { outputDir, inputDir, yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataBotRules,
      name,
      importMetaUrl: import.meta.url,
      expectedYAML: readBotYAML,
    })

    expect(yaml.result).toBe(yaml.expected)

    const expectedModule = fs.readFileSync(join(inputDir, "Ext", "Module.bsl"), "utf-8")
    expect(fs.readFileSync(join(outputDir, name, "Модуль.bsl"), "utf-8")).toBe(expectedModule)
  })
})
