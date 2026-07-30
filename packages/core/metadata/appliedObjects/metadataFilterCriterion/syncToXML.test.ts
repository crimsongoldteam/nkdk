import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "../../../tests/appliedObject"
import { MetadataFilterCriterionRules } from "./rules"
import { canonicalXML } from "../../../tests/canonicalXML"
import { canonicalFormSyncXML } from "../../../tests/formSyncXML"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("syncAppliedObjectToXML — MetadataFilterCriterion", () => {
  it("читает FilterCriterion из YAML и записывает XML в outputDir", async () => {
    const { inputDir, comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataFilterCriterionRules,
      name: "КритерийОтбораВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedFiles: [
        "КритерийОтбораВсеСвойства.xml",
        "Ext/ManagerModule.bsl",
        "Commands/Команда1/Ext/CommandModule.bsl",
        "КритерийОтбораВсеСвойства/Forms/ФормаСписка.xml",
        "КритерийОтбораВсеСвойства/Forms/ФормаСписка/Ext/Form.xml",
        "КритерийОтбораВсеСвойства/Forms/ФормаСписка/Ext/Form/Module.bsl",
      ],
    })
    for (const { path, result, expected } of comparisons) {
      if (path.endsWith("/Ext/Form.xml")) {
        const form = canonicalFormSyncXML({ path, result, expected, inputDir })
        expect(form.result, path).toEqual(form.expected)
      } else if (path.endsWith(".xml")) {
        expect(canonicalXML(result), path).toEqual(canonicalXML(expected))
      } else {
        expect(normalizeLineEndings(result), path).toBe(normalizeLineEndings(expected))
      }
    }
  })
})
