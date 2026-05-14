import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { MetadataScheduledJobRules } from "./rules"

const normalizeXML = (value: string): string => value.replace(/\r\n/g, "\n").trimEnd()

describe("syncAppliedObjectToXML — MetadataScheduledJob", () => {
  it("читает YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataScheduledJobRules,
      name: "РегламентноеЗаданиеВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedFiles: ["РегламентноеЗаданиеВсеСвойства.xml", "РегламентноеЗаданиеВсеСвойства/Ext/Schedule.xml"],
      externalObjectDir: true,
    })
    for (const { path, result, expected } of comparisons) {
      expect(normalizeXML(result), path).toBe(normalizeXML(expected))
    }
  })
})
