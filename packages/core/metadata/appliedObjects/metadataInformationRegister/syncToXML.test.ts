import fs from "fs"
import os from "os"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"
import { syncAppliedObjectToXML } from "~/metadata/orchestration/appliedObject/syncToXML"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { mockContextToXML } from "~/tests/mockContext"
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

  it("восстанавливает object-level модули регистра сведений при YAML to XML sync", async () => {
    const name = "РегистрСведенийВсеСвойстваНезависимый"
    const testDir = dirname(fileURLToPath(import.meta.url))
    const fixturesDir = join(testDir, "__fixtures__", "sync")
    const tmpDir = fs.mkdtempSync(join(os.tmpdir(), "information-register-sync-modules-"))
    const inputDir = join(tmpDir, "yaml")
    const referenceDir = join(tmpDir, "xml")
    const outputDir = join(tmpDir, "out")
    const managerModule =
      "Процедура ОбработкаПолученияДанныхВыбора(ДанныеВыбора, Параметры, СтандартнаяОбработка)\nКонецПроцедуры\n"
    const recordSetModule = "Процедура ПередЗаписью(Отказ, Замещение)\nКонецПроцедуры\n"

    await fs.promises.cp(join(fixturesDir, "yaml"), inputDir, { recursive: true })
    await fs.promises.cp(join(fixturesDir, "xml"), referenceDir, { recursive: true })
    await fs.promises.writeFile(join(inputDir, name, "МодульМенеджера.bsl"), managerModule)
    await fs.promises.writeFile(join(inputDir, name, "МодульНабораЗаписей.bsl"), recordSetModule)
    await fs.promises.mkdir(join(referenceDir, name, "Ext"), { recursive: true })
    await fs.promises.writeFile(join(referenceDir, name, "Ext", "ManagerModule.bsl"), managerModule)
    await fs.promises.writeFile(join(referenceDir, name, "Ext", "RecordSetModule.bsl"), recordSetModule)

    await syncAppliedObjectToXML({
      rule: MetadataInformationRegisterRules,
      context: mockContextToXML(),
      inputDir,
      name,
      outputDir,
      referenceDir,
      externalOutputDir: join(outputDir, name),
      externalReferenceDir: join(referenceDir, name),
    })

    expect(fs.readFileSync(join(outputDir, name, "Ext", "ManagerModule.bsl"), "utf-8")).toBe(managerModule)
    expect(fs.readFileSync(join(outputDir, name, "Ext", "RecordSetModule.bsl"), "utf-8")).toBe(recordSetModule)
  })
})
