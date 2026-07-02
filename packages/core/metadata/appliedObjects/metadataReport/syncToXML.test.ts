import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "../../../tests/appliedObject"
import { MetadataReportRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("syncAppliedObjectToXML — MetadataReport", () => {
  it("читает Report из YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataReportRules,
      name: "ОтчетВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedFiles: [
        "ОтчетВсеСвойства.xml",
        "ОтчетВсеСвойства/Ext/ObjectModule.bsl",
        "ОтчетВсеСвойства/Ext/ManagerModule.bsl",
        "ОтчетВсеСвойства/Ext/Help.xml",
        "ОтчетВсеСвойства/Ext/Help/ru.html",
        "ОтчетВсеСвойства/Commands/Команда1/Ext/CommandModule.bsl",
        "ОтчетВсеСвойства/Templates/Макет.xml",
        "ОтчетВсеСвойства/Templates/Макет/Ext/Template.txt",
        "ОтчетВсеСвойства/Templates/ОсновнаяСхемаКомпоновкиДанных.xml",
        "ОтчетВсеСвойства/Templates/ОсновнаяСхемаКомпоновкиДанных/Ext/Template.xml",
        "ОтчетВсеСвойства/Forms/ФормаОтчета.xml",
        "ОтчетВсеСвойства/Forms/ФормаОтчета/Ext/Form/Module.bsl",
        "ОтчетВсеСвойства/Forms/ФормаОтчета/Ext/Help.xml",
        "ОтчетВсеСвойства/Forms/ФормаОтчета/Ext/Help/ru.html",
        "ОтчетВсеСвойства/Forms/ФормаНастроек.xml",
        "ОтчетВсеСвойства/Forms/ФормаВарианта.xml",
      ],
    })
    for (const { path, result, expected } of comparisons) {
      expect(normalizeLineEndings(result), path).toBe(normalizeLineEndings(expected))
    }
  })
})
