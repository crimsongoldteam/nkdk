import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { MetadataRoleRules } from "./rules"

const normalizeXML = (value: string): string => value.replace(/\r\n/g, "\n")

describe("syncAppliedObjectToXML — MetadataRole", () => {
  it("читает YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataRoleRules,
      name: "РольВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedFiles: ["РольВсеСвойства.xml"],
    })
    for (const { path, result, expected } of comparisons) {
      expect(normalizeXML(result), path).toBe(normalizeXML(expected))
    }
  })
})
