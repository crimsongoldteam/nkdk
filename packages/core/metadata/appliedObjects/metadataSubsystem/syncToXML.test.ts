import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { MetadataSubsystemRules } from "./rules"

const normalizeXML = (value: string): string => value.replace(/\r\n/g, "\n")

describe("syncAppliedObjectToXML — MetadataSubsystem", () => {
  it("читает YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataSubsystemRules,
      name: "ПодсистемаВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedFiles: ["ПодсистемаВсеСвойства.xml"],
    })
    for (const { path, result, expected } of comparisons) {
      expect(normalizeXML(result), path).toBe(normalizeXML(expected))
    }
  })
})
