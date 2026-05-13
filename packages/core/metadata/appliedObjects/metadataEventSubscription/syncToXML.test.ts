import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { MetadataEventSubscriptionRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("syncAppliedObjectToXML — MetadataEventSubscription", () => {
  it("читает EventSubscription из YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataEventSubscriptionRules,
      name: "ПодпискаНаСобытиеВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedFiles: ["ПодпискаНаСобытиеВсеСвойства.xml"],
    })
    for (const { path, result, expected } of comparisons) {
      expect(normalizeLineEndings(result), path).toBe(normalizeLineEndings(expected))
    }
  })
})
