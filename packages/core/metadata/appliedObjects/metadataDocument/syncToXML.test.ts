import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { MetadataDocumentRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("syncAppliedObjectToXML — MetadataDocument", () => {
  it("читает Document из YAML и записывает XML + связанные модули", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataDocumentRules,
      name: "ДокументВсеСвойства",
      importMetaUrl: import.meta.url,
      externalObjectDir: true,
      expectedFiles: [
        "ДокументВсеСвойства.xml",
        "ДокументВсеСвойства/Ext/AdditionalIndexes.xml",
        "ДокументВсеСвойства/Ext/ObjectModule.bsl",
        "ДокументВсеСвойства/Ext/ManagerModule.bsl",
        "ДокументВсеСвойства/Commands/Команда1/Ext/CommandModule.bsl",
      ],
    })
    for (const { path, result, expected } of comparisons) {
      expect(normalizeLineEndings(result), path).toBe(normalizeLineEndings(expected))
    }
  })
})
