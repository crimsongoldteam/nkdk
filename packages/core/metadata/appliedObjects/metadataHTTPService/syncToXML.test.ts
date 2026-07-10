import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "../../../tests/appliedObject"
import { MetadataHTTPServiceRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("syncAppliedObjectToXML — MetadataHTTPService", () => {
  it("читает HTTPService из YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataHTTPServiceRules,
      name: "HTTPСервисВсеСвойства",
      importMetaUrl: import.meta.url,
      externalObjectDir: true,
      expectedFiles: ["HTTPСервисВсеСвойства.xml", "HTTPСервисВсеСвойства/Ext/Module.bsl"],
    })

    for (const { path, result, expected } of comparisons) {
      expect(normalizeLineEndings(result), path).toBe(normalizeLineEndings(expected))
    }
  })
})
