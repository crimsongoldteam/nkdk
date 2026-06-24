import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { MetadataFilterCriterionRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("syncAppliedObjectToXML — MetadataFilterCriterion", () => {
  it("читает FilterCriterion из YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
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
      expect(normalizeLineEndings(result), path).toBe(normalizeLineEndings(expected))
    }
  })
})
