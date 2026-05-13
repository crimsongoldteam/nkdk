import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { MetadataInformationRegisterRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("syncAppliedObjectToXML — MetadataInformationRegister", () => {
  it("читает InformationRegister из YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataInformationRegisterRules,
      name: "РегистрСведенийВсеСвойстваНезависимый",
      importMetaUrl: import.meta.url,
      externalObjectDir: true,
      expectedFiles: [
        "РегистрСведенийВсеСвойстваНезависимый.xml",
        "РегистрСведенийВсеСвойстваНезависимый/Ext/AdditionalIndexes.xml",
        "РегистрСведенийВсеСвойстваНезависимый/Commands/Команда1/Ext/CommandModule.bsl",
        "РегистрСведенийВсеСвойстваНезависимый/Forms/ФормаСписка.xml",
        "РегистрСведенийВсеСвойстваНезависимый/Forms/ФормаСписка/Ext/Form.xml",
        "РегистрСведенийВсеСвойстваНезависимый/Forms/ФормаСписка/Ext/Form/Module.bsl",
        "РегистрСведенийВсеСвойстваНезависимый/Forms/ФормаЗаписи.xml",
        "РегистрСведенийВсеСвойстваНезависимый/Forms/ФормаЗаписи/Ext/Form.xml",
        "РегистрСведенийВсеСвойстваНезависимый/Forms/ФормаЗаписи/Ext/Form/Module.bsl",
        "РегистрСведенийВсеСвойстваНезависимый/Templates/Макет.xml",
      ],
    })
    for (const { path, result, expected } of comparisons) {
      expect(normalizeLineEndings(result), path).toBe(normalizeLineEndings(expected))
    }
  })
})
