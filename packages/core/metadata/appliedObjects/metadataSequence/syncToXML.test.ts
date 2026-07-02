import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "../../../tests/appliedObject"
import { MetadataSequenceRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("syncAppliedObjectToXML — MetadataSequence", () => {
  it("читает Sequence из YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataSequenceRules,
      name: "ПоследовательностьВсеПоля",
      importMetaUrl: import.meta.url,
      externalObjectDir: true,
      expectedFiles: [
        "ПоследовательностьВсеПоля.xml",
        "ПоследовательностьВсеПоля/Ext/AdditionalIndexes.xml",
        "ПоследовательностьВсеПоля/Ext/RecordSetModule.bsl",
      ],
    })
    for (const { path, result, expected } of comparisons) {
      expect(normalizeLineEndings(result), path).toBe(normalizeLineEndings(expected))
    }
  })
})
