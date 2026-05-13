import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { MetadataDocumentJournalRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("syncAppliedObjectToXML — MetadataDocumentJournal", () => {
  it("читает DocumentJournal из YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
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
      expect(normalizeLineEndings(result), path).toBe(normalizeLineEndings(expected))
    }
  })
})
