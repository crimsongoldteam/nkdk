import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { MetadataXDTOPackageRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("syncAppliedObjectToXML — MetadataXDTOPackage", () => {
  it("читает XDTOPackage из YAML и записывает XML + Package.bin в outputDir", async () => {
    const { comparisons, binaryComparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataXDTOPackageRules,
      name: "ПакетXDTOВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedFiles: ["ПакетXDTOВсеСвойства.xml"],
      binaryExpectedFiles: ["ПакетXDTOВсеСвойства/Ext/Package.bin"],
    })

    for (const { path, result, expected } of comparisons) {
      expect(normalizeLineEndings(result), path).toBe(normalizeLineEndings(expected))
    }
    for (const { path, result, expected } of binaryComparisons) {
      expect(result, path).toEqual(expected)
    }
  })
})
