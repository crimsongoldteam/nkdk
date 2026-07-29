import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "../../../tests/appliedObject"
import { MetadataDocumentJournalRules } from "./rules"
import { canonicalXML } from "../../../tests/canonicalXML"
import { canonicalFormSyncXML } from "../../../tests/formSyncXML"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("syncAppliedObjectToXML — MetadataDocumentJournal", () => {
  it("читает DocumentJournal из YAML и записывает XML в outputDir", async () => {
    const { inputDir, comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataDocumentJournalRules,
      name: "ЖурналДокументовВсеСвойства",
      importMetaUrl: import.meta.url,
      externalObjectDir: true,
      expectedFiles: [
        "ЖурналДокументовВсеСвойства.xml",
        "ЖурналДокументовВсеСвойства/Ext/AdditionalIndexes.xml",
        "ЖурналДокументовВсеСвойства/Ext/ManagerModule.bsl",
        "ЖурналДокументовВсеСвойства/Ext/Help.xml",
        "ЖурналДокументовВсеСвойства/Ext/Help/ru.html",
        "ЖурналДокументовВсеСвойства/Commands/Команда1/Ext/CommandModule.bsl",
        "ЖурналДокументовВсеСвойства/Forms/ФормаСписка.xml",
        "ЖурналДокументовВсеСвойства/Forms/ФормаСписка/Ext/Form.xml",
        "ЖурналДокументовВсеСвойства/Forms/ФормаСписка/Ext/Form/Module.bsl",
        "ЖурналДокументовВсеСвойства/Templates/Макет.xml",
        "ЖурналДокументовВсеСвойства/Templates/Макет/Ext/Template.txt",
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
