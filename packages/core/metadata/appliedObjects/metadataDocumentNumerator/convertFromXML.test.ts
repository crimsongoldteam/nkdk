import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "../../../tests/appliedObject"
import { readNumeratorYAML } from "./__fixtures__/sync/data"
import { MetadataDocumentNumeratorRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataDocumentNumerator", () => {
  it("читает DocumentNumerator из XML и записывает Свойства.yaml в outputDir", async () => {
    const { yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataDocumentNumeratorRules,
      name: "НумераторПоУмолчанию",
      importMetaUrl: import.meta.url,
      expectedYAML: readNumeratorYAML,
    })
    expect(yaml.result).toBe(yaml.expected)
  })
})
