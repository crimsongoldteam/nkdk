import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { MetadataDataProcessorRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("syncAppliedObjectToXML — MetadataDataProcessor", () => {
  it("читает DataProcessor из YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataDataProcessorRules,
      name: "ОбработкаВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedFiles: [
        "ОбработкаВсеСвойства.xml",
        "ОбработкаВсеСвойства/Ext/ObjectModule.bsl",
        "ОбработкаВсеСвойства/Ext/ManagerModule.bsl",
        "ОбработкаВсеСвойства/Ext/Help.xml",
        "ОбработкаВсеСвойства/Ext/Help/ru.html",
        "ОбработкаВсеСвойства/Commands/Команда1/Ext/CommandModule.bsl",
        "ОбработкаВсеСвойства/Forms/Форма.xml",
        "ОбработкаВсеСвойства/Forms/Форма/Ext/Form.xml",
        "ОбработкаВсеСвойства/Forms/Форма/Ext/Form/Module.bsl",
        "ОбработкаВсеСвойства/Forms/Форма/Ext/Help.xml",
        "ОбработкаВсеСвойства/Forms/Форма/Ext/Help/ru.html",
        "ОбработкаВсеСвойства/Templates/Макет.xml",
        "ОбработкаВсеСвойства/Templates/Макет/Ext/Template.txt",
      ],
    })
    for (const { path, result, expected } of comparisons) {
      expect(normalizeLineEndings(result), path).toBe(normalizeLineEndings(expected))
    }
  })
})
