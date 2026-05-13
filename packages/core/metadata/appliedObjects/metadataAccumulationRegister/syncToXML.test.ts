import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { MetadataAccumulationRegisterRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("syncAppliedObjectToXML — MetadataAccumulationRegister", () => {
  it("читает AccumulationRegister из YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataAccumulationRegisterRules,
      name: "РегистрНакопленияВсеСвойстваОбороты",
      importMetaUrl: import.meta.url,
      externalObjectDir: true,
      expectedFiles: [
        "РегистрНакопленияВсеСвойстваОбороты.xml",
        "РегистрНакопленияВсеСвойстваОбороты/Ext/AdditionalIndexes.xml",
        "РегистрНакопленияВсеСвойстваОбороты/Ext/Aggregates.xml",
        "РегистрНакопленияВсеСвойстваОбороты/Ext/Help.xml",
        "РегистрНакопленияВсеСвойстваОбороты/Ext/Help/ru.html",
        "РегистрНакопленияВсеСвойстваОбороты/Ext/ManagerModule.bsl",
        "РегистрНакопленияВсеСвойстваОбороты/Ext/RecordSetModule.bsl",
        "РегистрНакопленияВсеСвойстваОбороты/Commands/Команда1/Ext/CommandModule.bsl",
        "РегистрНакопленияВсеСвойстваОбороты/Forms/ФормаСписка.xml",
        "РегистрНакопленияВсеСвойстваОбороты/Forms/ФормаСписка/Ext/Form.xml",
        "РегистрНакопленияВсеСвойстваОбороты/Forms/ФормаСписка/Ext/Form/Module.bsl",
        "РегистрНакопленияВсеСвойстваОбороты/Templates/Макет.xml",
      ],
    })
    for (const { path, result, expected } of comparisons) {
      expect(normalizeLineEndings(result), path).toBe(normalizeLineEndings(expected))
    }
  })
})
