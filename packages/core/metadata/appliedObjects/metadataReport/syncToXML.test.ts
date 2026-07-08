import fs from "fs"
import os from "os"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "../../../tests/appliedObject"
import { mockContextToXML } from "../../../tests/mockContext"
import { syncAppliedObjectToXML } from "../../orchestration/appliedObject/syncToXML"
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

  it("не затирает reference Synonym, если Синоним сокращён из YAML", async () => {
    const tmpDir = fs.mkdtempSync(join(os.tmpdir(), "report-sync-synonym-"))
    const inputDir = join(tmpDir, "yaml")
    const referenceDir = join(tmpDir, "xml")
    const outputDir = join(tmpDir, "out")
    const name = "ОтчетСКД"

    fs.mkdirSync(join(inputDir, name), { recursive: true })
    fs.mkdirSync(referenceDir, { recursive: true })
    fs.writeFileSync(join(inputDir, name, "Свойства.yaml"), "{}\n", "utf-8")
    fs.writeFileSync(
      join(referenceDir, `${name}.xml`),
      `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" version="2.20">
\t<Report uuid="5f67e404-0a01-4480-aa68-1149a6e085cc">
\t\t<InternalInfo/>
\t\t<Properties>
\t\t\t<Name>ОтчетСКД</Name>
\t\t\t<Synonym>
\t\t\t\t<v8:item>
\t\t\t\t\t<v8:lang>ru</v8:lang>
\t\t\t\t\t<v8:content>Отчет СКД</v8:content>
\t\t\t\t</v8:item>
\t\t\t</Synonym>
\t\t\t<Comment/>
\t\t\t<UseStandardCommands>true</UseStandardCommands>
\t\t</Properties>
\t</Report>
</MetaDataObject>
`,
      "utf-8"
    )

    await syncAppliedObjectToXML({
      rule: MetadataReportRules,
      context: mockContextToXML(),
      inputDir,
      name,
      outputDir,
      referenceDir,
    })

    const result = fs.readFileSync(join(outputDir, `${name}.xml`), "utf-8")
    expect(result).toContain("<v8:content>Отчет СКД</v8:content>")
    expect(result).not.toContain("<Synonym/>")
  })
})
