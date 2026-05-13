import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { MetadataConstantRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("syncAppliedObjectToXML — MetadataConstant", () => {
  it("читает Constant из YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataConstantRules,
      name: "КонстантаВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedFiles: [
        "КонстантаВсеСвойства.xml",
        "Ext/ManagerModule.bsl",
        "Ext/ValueManagerModule.bsl",
      ],
    })
    for (const { path, result, expected } of comparisons) {
      expect(normalizeLineEndings(result), path).toBe(normalizeLineEndings(expected))
    }
  })
})
