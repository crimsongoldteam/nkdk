import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { MetadataExchangePlanRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("syncAppliedObjectToXML — MetadataExchangePlan", () => {
  it("читает ExchangePlan из YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataExchangePlanRules,
      name: "ПланОбменаВсеСвойства",
      importMetaUrl: import.meta.url,
      externalObjectDir: true,
      expectedFiles: [
        "ПланОбменаВсеСвойства.xml",
        "ПланОбменаВсеСвойства/Ext/AdditionalIndexes.xml",
        "ПланОбменаВсеСвойства/Ext/Content.xml",
        "ПланОбменаВсеСвойства/Ext/Help.xml",
        "ПланОбменаВсеСвойства/Ext/Help/ru.html",
        "ПланОбменаВсеСвойства/Ext/ObjectModule.bsl",
        "ПланОбменаВсеСвойства/Ext/ManagerModule.bsl",
        "ПланОбменаВсеСвойства/Commands/Команда1/Ext/CommandModule.bsl",
        "ПланОбменаВсеСвойства/Forms/ФормаУзла.xml",
        "ПланОбменаВсеСвойства/Forms/ФормаУзла/Ext/Form.xml",
        "ПланОбменаВсеСвойства/Forms/ФормаУзла/Ext/Form/Module.bsl",
        "ПланОбменаВсеСвойства/Forms/ФормаСписка.xml",
        "ПланОбменаВсеСвойства/Forms/ФормаСписка/Ext/Form.xml",
        "ПланОбменаВсеСвойства/Forms/ФормаСписка/Ext/Form/Module.bsl",
        "ПланОбменаВсеСвойства/Forms/ФормаВыбора.xml",
        "ПланОбменаВсеСвойства/Forms/ФормаВыбора/Ext/Form.xml",
        "ПланОбменаВсеСвойства/Forms/ФормаВыбора/Ext/Form/Module.bsl",
        "ПланОбменаВсеСвойства/Templates/Макет.xml",
        "ПланОбменаВсеСвойства/Templates/Макет/Ext/Template.txt",
      ],
    })
    for (const { path, result, expected } of comparisons) {
      expect(normalizeLineEndings(result), path).toBe(normalizeLineEndings(expected))
    }
  })
})
