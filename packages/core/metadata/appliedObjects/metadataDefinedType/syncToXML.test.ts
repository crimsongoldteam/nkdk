import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "../../../tests/appliedObject"
import { MetadataDefinedTypeRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("syncAppliedObjectToXML — MetadataDefinedType", () => {
  it("читает DefinedType из YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataDefinedTypeRules,
      name: "ОпределяемыйТипВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedFiles: ["ОпределяемыйТипВсеСвойства.xml"],
    })
    for (const { path, result, expected } of comparisons) {
      expect(normalizeLineEndings(result), path).toBe(normalizeLineEndings(expected))
    }
  })
})
