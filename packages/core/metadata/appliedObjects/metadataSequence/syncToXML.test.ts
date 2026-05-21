import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { MetadataSequenceRules } from "./rules"

describe("syncAppliedObjectToXML — MetadataSequence", () => {
  it("читает Sequence из YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataSequenceRules,
      name: "ПоследовательностьВсеПоля",
      importMetaUrl: import.meta.url,
      externalObjectDir: true,
      expectedFiles: ["ПоследовательностьВсеПоля.xml", "ПоследовательностьВсеПоля/Ext/RecordSetModule.bsl"],
    })
    for (const { path, result, expected } of comparisons) {
      expect(result, path).toBe(expected)
    }
  })
})
