import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "../../../tests/appliedObject"
import { MetadataFunctionalOptionsParameterRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("syncAppliedObjectToXML — MetadataFunctionalOptionsParameter", () => {
  it("читает FunctionalOptionsParameter из YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataFunctionalOptionsParameterRules,
      name: "ПараметрФункциональныхОпцийВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedFiles: ["ПараметрФункциональныхОпцийВсеСвойства.xml"],
    })
    for (const { path, result, expected } of comparisons) {
      expect(normalizeLineEndings(result), path).toBe(normalizeLineEndings(expected))
    }
  })
})
