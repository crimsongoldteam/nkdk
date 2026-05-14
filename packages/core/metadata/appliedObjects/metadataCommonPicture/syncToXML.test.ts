import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { MetadataCommonPictureRules } from "./rules"

const normalizeXML = (value: string): string => value.replace(/\r\n/g, "\n")

describe("syncAppliedObjectToXML — MetadataCommonPicture", () => {
  it("читает YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataCommonPictureRules,
      name: "ОбщаяКартинкаВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedFiles: ["ОбщаяКартинкаВсеСвойства.xml"],
    })
    for (const { path, result, expected } of comparisons) {
      expect(normalizeXML(result), path).toBe(normalizeXML(expected))
    }
  })
})
