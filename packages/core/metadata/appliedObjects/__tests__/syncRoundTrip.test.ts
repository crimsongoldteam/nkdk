import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "../../../tests/appliedObject"
import { canonicalXML } from "../../../tests/canonicalXML"
import { canonicalFormSyncXML } from "../../../tests/formSyncXML"
import { appliedObjectSyncCases } from "./yamlFixtures"
import { canonicalAccountingRegisterXML } from "./accountingRegisterXML"

const normalizeText = (value: string) =>
  value
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .trimEnd()

describe("applied object YAML -> XML sync", () => {
  it.each(appliedObjectSyncCases)("$label", async ({ scenario, sync }) => {
    const { inputDir, comparisons, binaryComparisons } = await testSyncAppliedObjectToXML({
      rule: scenario.rule,
      name: sync.name,
      importMetaUrl: scenario.importMetaUrl,
      expectedFiles: [`${sync.name}.xml`],
      externalObjectDir: sync.externalObjectDir,
    })

    for (const { path, result, expected } of comparisons) {
      if (path.endsWith("/Ext/Form.xml")) {
        const form = canonicalFormSyncXML({ path, result, expected, inputDir })
        expect(form.result, path).toEqual(form.expected)
      } else if (path.endsWith(".xml")) {
        const canonical =
          scenario.group === "metadataAccountingRegister" ? canonicalAccountingRegisterXML : canonicalXML
        expect(canonical(result), path).toEqual(canonical(expected))
      } else {
        expect(normalizeText(result), path).toBe(normalizeText(expected))
      }
    }
    for (const { path, result, expected } of binaryComparisons) {
      expect(result, path).toEqual(expected)
    }
  })
})
