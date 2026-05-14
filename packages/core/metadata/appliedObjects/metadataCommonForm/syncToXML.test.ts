import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { MetadataCommonFormRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("syncAppliedObjectToXML — MetadataCommonForm", () => {
  it("writes CommonForm XML and external form XML", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataCommonFormRules,
      name: "КонстантаВсеСвойства",
      importMetaUrl: import.meta.url,
      externalObjectDir: true,
      expectedFiles: ["КонстантаВсеСвойства.xml", "КонстантаВсеСвойства/Ext/Form.xml"],
    })
    for (const { path, result, expected } of comparisons) {
      expect(normalizeLineEndings(result), path).toBe(normalizeLineEndings(expected))
    }
  })
})
