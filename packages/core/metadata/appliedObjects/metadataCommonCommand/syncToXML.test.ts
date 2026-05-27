import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { MetadataCommonCommandRules } from "./rules"

const normalizeLineEndings = (value: string) =>
  value
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .trimEnd()

describe("syncAppliedObjectToXML — MetadataCommonCommand", () => {
  it("читает CommonCommand из YAML и записывает XML + модуль в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataCommonCommandRules,
      name: "ОбщаяКомандаПолная",
      importMetaUrl: import.meta.url,
      externalObjectDir: true,
      expectedFiles: ["ОбщаяКомандаПолная.xml", "ОбщаяКомандаПолная/Ext/CommandModule.bsl"],
    })

    for (const { path, result, expected } of comparisons) {
      expect(normalizeLineEndings(result), path).toBe(normalizeLineEndings(expected))
    }
  })
})
