import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "~/tests/appliedObject"
import { readSequenceYAML } from "./__fixtures__/sync/data"
import { MetadataSequenceRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataSequence", () => {
  it("читает Sequence из XML и записывает Свойства.yaml в outputDir", async () => {
    const { yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataSequenceRules,
      name: "ПоследовательностьВсеПоля",
      importMetaUrl: import.meta.url,
      expectedYAML: readSequenceYAML,
    })
    expect(yaml.result).toBe(yaml.expected)
  })
})
