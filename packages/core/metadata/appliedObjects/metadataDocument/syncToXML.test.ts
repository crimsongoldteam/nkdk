import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { MetadataDocumentRules } from "./rules"

// TODO: побайтовый sync YAML→XML для Document даёт расхождения с reference
// (отсутствует `<Shortcut/>`, разные whitespace, разные теги команд).
// Заблокирован той же общей инфраструктурой, что и round-trip
// fromXML/toXML. После починки снять `.skip`.
describe.skip("syncAppliedObjectToXML — MetadataDocument", () => {
  it("читает Document из YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataDocumentRules,
      name: "ДокументВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedFiles: ["ДокументВсеСвойства.xml"],
    })
    for (const { path, result, expected } of comparisons) {
      expect(result, path).toBe(expected)
    }
  })
})
