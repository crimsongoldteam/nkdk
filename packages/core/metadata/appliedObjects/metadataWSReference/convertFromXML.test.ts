import fs from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "~/tests/appliedObject"
import { readWSReferenceYAML } from "./__fixtures__/sync/data"
import { MetadataWSReferenceRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataWSReference", () => {
  const name = "WSСсылкаВсеСвойства"

  it("читает WSReference из XML и записывает Свойства.yaml + WSDefinition.xml", async () => {
    const { outputDir, inputDir, yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataWSReferenceRules,
      name,
      importMetaUrl: import.meta.url,
      expectedYAML: readWSReferenceYAML,
    })

    expect(yaml.result).toBe(yaml.expected)

    const expectedDefinition = fs.readFileSync(join(inputDir, "Ext", "WSDefinition.xml"), "utf-8")
    expect(fs.readFileSync(join(outputDir, name, "WSDefinition.xml"), "utf-8")).toBe(expectedDefinition)
  })
})
