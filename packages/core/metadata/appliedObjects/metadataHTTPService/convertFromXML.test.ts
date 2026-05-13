import fs from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "~/tests/appliedObject"
import { readHTTPServiceYAML } from "./__fixtures__/sync/data"
import { MetadataHTTPServiceRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataHTTPService", () => {
  const name = "HTTPСервисВсеСвойства"

  it("читает HTTPService из XML и записывает Свойства.yaml + модуль", async () => {
    const { outputDir, inputDir, yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataHTTPServiceRules,
      name,
      importMetaUrl: import.meta.url,
      expectedYAML: readHTTPServiceYAML,
    })

    expect(yaml.result).toBe(yaml.expected)
    expect(yaml.result).toContain("HTTPМетод: GET")

    const expectedModule = fs.readFileSync(join(inputDir, name, "Ext", "Module.bsl"), "utf-8")
    expect(fs.readFileSync(join(outputDir, name, "Модуль.bsl"), "utf-8")).toBe(expectedModule)
  })
})
