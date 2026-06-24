import fs from "fs"
import os from "os"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { syncAppliedObjectToXML } from "~/metadata/orchestration/appliedObject/syncToXML"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { mockContextToXML } from "~/tests/mockContext"
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

  it("сохраняет пустой Ext/Content.xml из reference, когда Состав отсутствует в YAML", async () => {
    const name = "ПланОбменаПустойСостав"
    const tmpDir = fs.mkdtempSync(join(os.tmpdir(), "exchange-plan-empty-content-"))
    const inputDir = join(tmpDir, "yaml")
    const referenceDir = join(tmpDir, "xml")
    const outputDir = join(tmpDir, "out")
    const yamlObjectDir = join(inputDir, name)
    const referenceObjectDir = join(referenceDir, name)

    await fs.promises.mkdir(yamlObjectDir, { recursive: true })
    await fs.promises.mkdir(join(referenceObjectDir, "Ext"), { recursive: true })
    await fs.promises.writeFile(
      join(yamlObjectDir, "Свойства.yaml"),
      "Синоним: Пустой состав\nДлинаКода: 9\nДлинаНаименования: 25\n",
      "utf-8"
    )
    await fs.promises.writeFile(
      join(referenceDir, `${name}.xml`),
      `<?xml version="1.0" encoding="UTF-8"?>\n<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:cmi="http://v8.1c.ru/8.2/managed-application/cmi" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise" xmlns:lf="http://v8.1c.ru/8.2/managed-application/logform" xmlns:style="http://v8.1c.ru/8.1/data/ui/style" xmlns:sys="http://v8.1c.ru/8.1/data/ui/fonts/system" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:web="http://v8.1c.ru/8.1/data/ui/colors/web" xmlns:win="http://v8.1c.ru/8.1/data/ui/colors/windows" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">\n\t<ExchangePlan uuid="00000000-0000-0000-0000-000000000001">\n\t\t<Properties>\n\t\t\t<Name>${name}</Name>\n\t\t\t<Synonym>\n\t\t\t\t<v8:item>\n\t\t\t\t\t<v8:lang>ru</v8:lang>\n\t\t\t\t\t<v8:content>Пустой состав</v8:content>\n\t\t\t\t</v8:item>\n\t\t\t</Synonym>\n\t\t</Properties>\n\t</ExchangePlan>\n</MetaDataObject>`,
      "utf-8"
    )
    await fs.promises.writeFile(
      join(referenceObjectDir, "Ext", "Content.xml"),
      `<?xml version="1.0" encoding="UTF-8"?>\n<ExchangePlanContent xmlns="http://v8.1c.ru/8.3/xcf/extrnprops" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20"/>`,
      "utf-8"
    )

    await syncAppliedObjectToXML({
      rule: MetadataExchangePlanRules,
      context: mockContextToXML(),
      inputDir,
      name,
      outputDir,
      referenceDir,
      externalOutputDir: join(outputDir, name),
      externalReferenceDir: referenceObjectDir,
    })

    expect(fs.readFileSync(join(outputDir, name, "Ext", "Content.xml"), "utf-8")).toContain("<ExchangePlanContent")
  })
})
